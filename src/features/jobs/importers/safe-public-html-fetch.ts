import { lookup } from "node:dns/promises";
import { request as requestHttp } from "node:http";
import { request as requestHttps } from "node:https";
import { isIP, type LookupFunction } from "node:net";

const MAX_REDIRECTS = 3;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 1_000_000;

export type ResolvedAddress = {
  address: string;
  family: 4 | 6;
};

type PublicHtmlResponse = {
  body: Uint8Array;
  headers: Record<string, string | string[] | undefined>;
  statusCode: number;
};

type ResolveHostname = (hostname: string) => Promise<ResolvedAddress[]>;
type RequestPublicHtml = (
  url: URL,
  addresses: readonly ResolvedAddress[],
  deadlineAt: number,
  signal: AbortSignal,
) => Promise<PublicHtmlResponse>;

type SafePublicHtmlFetchDependencies = {
  requestPublicHtml?: RequestPublicHtml;
  resolveHostname?: ResolveHostname;
};

export class PublicHtmlFetchError extends Error {
  constructor(
    readonly code:
      | "BODY_TOO_LARGE"
      | "INVALID_CONTENT_TYPE"
      | "RETRIEVAL_FAILED"
      | "TOO_MANY_REDIRECTS"
      | "UNSAFE_URL",
  ) {
    super(code);
  }
}

function parseIpv4(address: string) {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return undefined;
  }

  return (((octets[0] << 24) >>> 0) + (octets[1] << 16) + (octets[2] << 8) + octets[3]) >>> 0;
}

function isIpv4InRange(value: number, start: number, prefixLength: number) {
  const mask = prefixLength === 0 ? 0 : ((0xffffffff << (32 - prefixLength)) >>> 0);
  return (value & mask) === (start & mask);
}

function isPublicIpv4(address: string) {
  const value = parseIpv4(address);
  if (value === undefined) {
    return false;
  }

  const nonPublicRanges: Array<[string, number]> = [
    ["0.0.0.0", 8],
    ["10.0.0.0", 8],
    ["100.64.0.0", 10],
    ["127.0.0.0", 8],
    ["169.254.0.0", 16],
    ["172.16.0.0", 12],
    ["192.0.0.0", 24],
    ["192.0.2.0", 24],
    ["192.88.99.0", 24],
    ["192.168.0.0", 16],
    ["198.18.0.0", 15],
    ["198.51.100.0", 24],
    ["203.0.113.0", 24],
    ["224.0.0.0", 4],
    ["240.0.0.0", 4],
  ];

  return !nonPublicRanges.some(([rangeStart, prefixLength]) =>
    isIpv4InRange(value, parseIpv4(rangeStart)!, prefixLength),
  );
}

function parseIpv6(address: string) {
  const normalizedAddress = address.toLocaleLowerCase().replace(/^\[|\]$/g, "");
  const embeddedIpv4Index = normalizedAddress.lastIndexOf(":");
  const embeddedIpv4 = normalizedAddress.slice(embeddedIpv4Index + 1);
  const hasEmbeddedIpv4 = embeddedIpv4.includes(".");
  const ipv4Value = hasEmbeddedIpv4 ? parseIpv4(embeddedIpv4) : undefined;

  if (hasEmbeddedIpv4 && ipv4Value === undefined) {
    return undefined;
  }

  const addressWithExpandedIpv4 = hasEmbeddedIpv4
    ? `${normalizedAddress.slice(0, embeddedIpv4Index)}:${((ipv4Value! >>> 16) & 0xffff).toString(16)}:${(ipv4Value! & 0xffff).toString(16)}`
    : normalizedAddress;
  const [beforeCompression, afterCompression] = addressWithExpandedIpv4.split("::");

  if (addressWithExpandedIpv4.split("::").length > 2) {
    return undefined;
  }

  const beforeGroups = beforeCompression ? beforeCompression.split(":") : [];
  const afterGroups = afterCompression ? afterCompression.split(":") : [];
  const missingGroups = 8 - beforeGroups.length - afterGroups.length;
  const groups = addressWithExpandedIpv4.includes("::")
    ? [...beforeGroups, ...Array(Math.max(0, missingGroups)).fill("0"), ...afterGroups]
    : beforeGroups;

  if (groups.length !== 8 || groups.some((group) => !/^[0-9a-f]{1,4}$/i.test(group))) {
    return undefined;
  }

  return groups.reduce(
    (value, group) => (value << BigInt(16)) + BigInt(`0x${group}`),
    BigInt(0),
  );
}

function hasIpv6Prefix(value: bigint, prefix: string, prefixLength: number) {
  const prefixValue = parseIpv6(prefix);
  if (prefixValue === undefined) {
    return false;
  }

  const shift = BigInt(128 - prefixLength);
  return (value >> shift) === (prefixValue >> shift);
}

function isPublicIpv6(address: string) {
  const value = parseIpv6(address);
  if (value === undefined) {
    return false;
  }

  if (hasIpv6Prefix(value, "::ffff:0:0", 96)) {
    const mappedIpv4 = Number(value & BigInt("0xffffffff"));
    return isPublicIpv4(
      [
        (mappedIpv4 >>> 24) & 0xff,
        (mappedIpv4 >>> 16) & 0xff,
        (mappedIpv4 >>> 8) & 0xff,
        mappedIpv4 & 0xff,
      ].join("."),
    );
  }

  const nonPublicRanges: Array<[string, number]> = [
    ["::", 128],
    ["::1", 128],
    ["100::", 64],
    ["2001:2::", 48],
    ["2001:10::", 28],
    ["2001:db8::", 32],
    ["3fff::", 20],
    ["5f00::", 16],
    ["fc00::", 7],
    ["fe80::", 10],
    ["ff00::", 8],
  ];

  return !nonPublicRanges.some(([rangeStart, prefixLength]) =>
    hasIpv6Prefix(value, rangeStart, prefixLength),
  );
}

export function isPublicIpAddress(address: string) {
  const family = isIP(address);
  return family === 4 ? isPublicIpv4(address) : family === 6 ? isPublicIpv6(address) : false;
}

function assertSafePublicUrl(url: URL) {
  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username ||
    url.password ||
    !url.hostname
  ) {
    throw new PublicHtmlFetchError("UNSAFE_URL");
  }

  const literalAddress = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(literalAddress) && !isPublicIpAddress(literalAddress)) {
    throw new PublicHtmlFetchError("UNSAFE_URL");
  }
}

async function resolvePublicHostname(hostname: string): Promise<ResolvedAddress[]> {
  const literalAddress = hostname.replace(/^\[|\]$/g, "");
  if (isIP(literalAddress)) {
    if (!isPublicIpAddress(literalAddress)) {
      throw new PublicHtmlFetchError("UNSAFE_URL");
    }

    return [{ address: literalAddress, family: isIP(literalAddress) as 4 | 6 }];
  }

  let addresses: ResolvedAddress[];
  try {
    addresses = (await lookup(hostname, { all: true, verbatim: true })).map((address) => ({
      address: address.address,
      family: address.family as 4 | 6,
    }));
  } catch {
    throw new PublicHtmlFetchError("RETRIEVAL_FAILED");
  }

  if (addresses.length === 0 || addresses.some((address) => !isPublicIpAddress(address.address))) {
    throw new PublicHtmlFetchError("UNSAFE_URL");
  }

  return addresses;
}

export function createPinnedLookup(
  addresses: readonly ResolvedAddress[],
): LookupFunction {
  if (addresses.some((address) => !isPublicIpAddress(address.address))) {
    throw new PublicHtmlFetchError("UNSAFE_URL");
  }

  const pinnedAddresses = addresses.map(({ address, family }) => ({ address, family }));

  if (pinnedAddresses.length === 0) {
    throw new Error("A pinned lookup requires at least one validated address.");
  }

  return (_hostname, options, callback) => {
    if (options.all === true) {
      callback(null, [...pinnedAddresses]);
      return;
    }

    const [address] = pinnedAddresses;
    callback(null, address.address, address.family);
  };
}

async function requestPublicHtml(
  url: URL,
  addresses: readonly ResolvedAddress[],
  deadlineAt: number,
  signal: AbortSignal,
): Promise<PublicHtmlResponse> {
  const request = url.protocol === "https:" ? requestHttps : requestHttp;

  return new Promise((resolve, reject) => {
    let settled = false;
    const remainingDeadlineMs = deadlineAt - Date.now();

    if (remainingDeadlineMs <= 0) {
      reject(new PublicHtmlFetchError("RETRIEVAL_FAILED"));
      return;
    }

    function rejectForDeadline() {
      requestHandle.destroy();
      settle(() => reject(new PublicHtmlFetchError("RETRIEVAL_FAILED")));
    }
    function settle(callback: () => void) {
      if (!settled) {
        settled = true;
        clearTimeout(deadlineTimer);
        signal.removeEventListener("abort", rejectForDeadline);
        requestHandle.setTimeout(0);
        callback();
      }
    }

    const deadlineTimer = setTimeout(rejectForDeadline, remainingDeadlineMs);
    const requestHandle = request(
      url,
      {
        headers: {
          Accept: "text/html, application/xhtml+xml",
        },
        lookup: createPinnedLookup(addresses),
        method: "GET",
      },
      (response) => {
        const chunks: Uint8Array[] = [];
        let receivedBytes = 0;

        response.on("data", (chunk: Uint8Array) => {
          receivedBytes += chunk.byteLength;
          if (receivedBytes > MAX_RESPONSE_BYTES) {
            response.destroy();
            settle(() => reject(new PublicHtmlFetchError("BODY_TOO_LARGE")));
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => {
          settle(() =>
            resolve({
              body: Buffer.concat(chunks),
              headers: response.headers,
              statusCode: response.statusCode ?? 0,
            }),
          );
        });
        response.on("error", () => {
          settle(() => reject(new PublicHtmlFetchError("RETRIEVAL_FAILED")));
        });
      },
    );

    requestHandle.setTimeout(REQUEST_TIMEOUT_MS, () => {
      requestHandle.destroy();
      settle(() => reject(new PublicHtmlFetchError("RETRIEVAL_FAILED")));
    });
    requestHandle.on("error", () => {
      settle(() => reject(new PublicHtmlFetchError("RETRIEVAL_FAILED")));
    });
    signal.addEventListener("abort", rejectForDeadline, { once: true });
    if (signal.aborted) {
      rejectForDeadline();
      return;
    }
    requestHandle.end();
  });
}

function awaitWithinFetchDeadline<T>(
  operation: Promise<T>,
  deadlineAt: number,
  abortController: AbortController,
) {
  const remainingDeadlineMs = deadlineAt - Date.now();
  if (remainingDeadlineMs <= 0) {
    return Promise.reject<T>(new PublicHtmlFetchError("RETRIEVAL_FAILED"));
  }

  return new Promise<T>((resolve, reject) => {
    const deadlineTimer = setTimeout(() => {
      abortController.abort();
      reject(new PublicHtmlFetchError("RETRIEVAL_FAILED"));
    }, remainingDeadlineMs);

    operation.then(
      (value) => {
        clearTimeout(deadlineTimer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(deadlineTimer);
        reject(error);
      },
    );
  });
}

function getHeader(headers: PublicHtmlResponse["headers"], name: string) {
  const value = headers[name] ?? headers[name.toLocaleLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function isHtmlContentType(contentType: string | undefined) {
  const mediaType = contentType?.split(";", 1)[0]?.trim().toLocaleLowerCase();
  return mediaType === "text/html" || mediaType === "application/xhtml+xml";
}

function isRedirect(statusCode: number) {
  return [301, 302, 303, 307, 308].includes(statusCode);
}

export async function fetchSafePublicHtml(
  submittedUrl: URL,
  dependencies: SafePublicHtmlFetchDependencies = {},
) {
  const resolveHostname = dependencies.resolveHostname ?? resolvePublicHostname;
  const requestHtml = dependencies.requestPublicHtml ?? requestPublicHtml;
  const abortController = new AbortController();
  const deadlineAt = Date.now() + REQUEST_TIMEOUT_MS;
  let currentUrl = new URL(submittedUrl);

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    assertSafePublicUrl(currentUrl);
    const addresses = await awaitWithinFetchDeadline(
      resolveHostname(currentUrl.hostname),
      deadlineAt,
      abortController,
    );

    if (addresses.length === 0 || addresses.some((address) => !isPublicIpAddress(address.address))) {
      throw new PublicHtmlFetchError("UNSAFE_URL");
    }

    const response = await awaitWithinFetchDeadline(
      requestHtml(currentUrl, addresses, deadlineAt, abortController.signal),
      deadlineAt,
      abortController,
    );
    const contentLength = Number(getHeader(response.headers, "content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
      throw new PublicHtmlFetchError("BODY_TOO_LARGE");
    }
    if (response.body.byteLength > MAX_RESPONSE_BYTES) {
      throw new PublicHtmlFetchError("BODY_TOO_LARGE");
    }

    if (isRedirect(response.statusCode)) {
      const location = getHeader(response.headers, "location");
      if (!location) {
        throw new PublicHtmlFetchError("RETRIEVAL_FAILED");
      }
      if (redirectCount === MAX_REDIRECTS) {
        throw new PublicHtmlFetchError("TOO_MANY_REDIRECTS");
      }

      try {
        currentUrl = new URL(location, currentUrl);
      } catch {
        throw new PublicHtmlFetchError("RETRIEVAL_FAILED");
      }
      continue;
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new PublicHtmlFetchError("RETRIEVAL_FAILED");
    }
    if (!isHtmlContentType(getHeader(response.headers, "content-type"))) {
      throw new PublicHtmlFetchError("INVALID_CONTENT_TYPE");
    }

    return {
      finalUrl: currentUrl,
      html: new TextDecoder().decode(response.body),
    };
  }

  throw new PublicHtmlFetchError("TOO_MANY_REDIRECTS");
}
