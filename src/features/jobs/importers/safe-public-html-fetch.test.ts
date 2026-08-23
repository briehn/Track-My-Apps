import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createPinnedLookup,
  fetchSafePublicHtml,
  isPublicIpAddress,
  PublicHtmlFetchError,
} from "@/features/jobs/importers/safe-public-html-fetch";

const publicAddress = { address: "93.184.216.34", family: 4 as const };
const publicIpv6Address = { address: "2606:2800:220:1:248:1893:25c8:1946", family: 6 as const };

function htmlResponse(html = "<html></html>") {
  return {
    body: new TextEncoder().encode(html),
    headers: { "content-type": "text/html; charset=utf-8" },
    statusCode: 200,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("safe public HTML fetch", () => {
  it("returns the first validated address in normal lookup mode", () => {
    const lookup = createPinnedLookup([publicAddress, publicIpv6Address]);
    let result: { address: string; family: number } | undefined;

    lookup("careers.example.com", { all: false }, (_error, address, family) => {
      result = { address: address as string, family: family! };
    });

    expect(result).toEqual(publicAddress);
  });

  it("returns only validated addresses in order when Node requests all addresses", () => {
    const lookup = createPinnedLookup([publicAddress, publicIpv6Address]);
    let result: Array<{ address: string; family: number }> | undefined;

    lookup("careers.example.com", { all: true }, (_error, addresses) => {
      result = addresses as Array<{ address: string; family: number }>;
    });

    expect(result).toEqual([publicAddress, publicIpv6Address]);
  });

  it("rejects creating a pinned lookup without a validated address", () => {
    expect(() => createPinnedLookup([])).toThrow(
      "A pinned lookup requires at least one validated address.",
    );
  });

  it("does not allow an unsafe address into a pinned lookup", () => {
    expect(() => createPinnedLookup([{ address: "127.0.0.1", family: 4 }])).toThrow(
      "UNSAFE_URL",
    );
  });

  it("allows a public HTTP(S) response after resolution", async () => {
    const result = await fetchSafePublicHtml(new URL("https://careers.example.com/job/1"), {
      requestPublicHtml: async () => htmlResponse("<html>job</html>"),
      resolveHostname: async () => [publicAddress],
    });

    expect(result.html).toBe("<html>job</html>");
    expect(result.finalUrl.toString()).toBe("https://careers.example.com/job/1");
  });

  it("cleans up the total-deadline timer after a successful response", async () => {
    vi.useFakeTimers();

    await expect(
      fetchSafePublicHtml(new URL("https://careers.example.com/job/1"), {
        requestPublicHtml: async () => htmlResponse("<html>job</html>"),
        resolveHostname: async () => [publicAddress],
      }),
    ).resolves.toMatchObject({ html: "<html>job</html>" });

    expect(vi.getTimerCount()).toBe(0);
  });

  it("enforces the total deadline when a request never responds", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    const result = fetchSafePublicHtml(new URL("https://careers.example.com/job/1"), {
      requestPublicHtml: async (_url, _addresses, _deadlineAt, requestSignal) => {
        signal = requestSignal;
        return new Promise(() => undefined);
      },
      resolveHostname: async () => [publicAddress],
    });
    const assertion = expect(result).rejects.toMatchObject({
      code: "RETRIEVAL_FAILED",
    } satisfies Partial<PublicHtmlFetchError>);

    await vi.advanceTimersByTimeAsync(10_000);

    await assertion;
    expect(signal?.aborted).toBe(true);
  });

  it("aborts a continuously active request when the shared wall-clock deadline expires", async () => {
    vi.useFakeTimers();
    let receivedChunks = 0;
    const result = fetchSafePublicHtml(new URL("https://careers.example.com/job/1"), {
      requestPublicHtml: async (_url, _addresses, _deadlineAt, signal) =>
        new Promise((resolve, reject) => {
          const interval = setInterval(() => {
            receivedChunks += 1;
          }, 1_000);
          signal.addEventListener("abort", () => {
            clearInterval(interval);
            reject(new Error("request aborted"));
          }, { once: true });
        }),
      resolveHostname: async () => [publicAddress],
    });
    const assertion = expect(result).rejects.toMatchObject({
      code: "RETRIEVAL_FAILED",
    } satisfies Partial<PublicHtmlFetchError>);

    await vi.advanceTimersByTimeAsync(10_000);

    await assertion;
    expect(receivedChunks).toBeGreaterThan(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("shares one deadline across redirects instead of resetting it per hop", async () => {
    vi.useFakeTimers();
    const requestedUrls: string[] = [];
    const result = fetchSafePublicHtml(new URL("https://careers.example.com/job/1"), {
      requestPublicHtml: async (url, _addresses, _deadlineAt, signal) => {
        requestedUrls.push(url.toString());
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            resolve(
              requestedUrls.length === 1
                ? {
                    body: new Uint8Array(),
                    headers: { location: "/job/2" },
                    statusCode: 302,
                  }
                : htmlResponse("<html>job</html>"),
            );
          }, 6_000);
          signal.addEventListener("abort", () => {
            clearTimeout(timeout);
            reject(new Error("request aborted"));
          }, { once: true });
        });
      },
      resolveHostname: async () => [publicAddress],
    });
    const assertion = expect(result).rejects.toMatchObject({
      code: "RETRIEVAL_FAILED",
    } satisfies Partial<PublicHtmlFetchError>);

    await vi.advanceTimersByTimeAsync(10_000);

    await assertion;
    expect(requestedUrls).toEqual([
      "https://careers.example.com/job/1",
      "https://careers.example.com/job/2",
    ]);
  });

  it.each(["ftp://example.com/job", "file:///etc/passwd", "https://user:pass@example.com/job"])(
    "rejects unsafe URL %s",
    async (value) => {
      await expect(
        fetchSafePublicHtml(new URL(value), {
          requestPublicHtml: async () => htmlResponse(),
          resolveHostname: async () => [publicAddress],
        }),
      ).rejects.toMatchObject({ code: "UNSAFE_URL" } satisfies Partial<PublicHtmlFetchError>);
    },
  );

  it("rejects loopback, private, link-local, and IPv6 internal destinations", () => {
    expect(isPublicIpAddress("127.0.0.1")).toBe(false);
    expect(isPublicIpAddress("10.0.0.4")).toBe(false);
    expect(isPublicIpAddress("169.254.10.4")).toBe(false);
    expect(isPublicIpAddress("192.168.1.4")).toBe(false);
    expect(isPublicIpAddress("::1")).toBe(false);
    expect(isPublicIpAddress("fc00::1")).toBe(false);
    expect(isPublicIpAddress("fe80::1")).toBe(false);
    expect(isPublicIpAddress("93.184.216.34")).toBe(true);
  });

  it("rejects a hostname that resolves to a private address before requesting it", async () => {
    let requestCount = 0;
    await expect(
      fetchSafePublicHtml(new URL("https://internal.example/job"), {
        requestPublicHtml: async () => {
          requestCount += 1;
          return htmlResponse();
        },
        resolveHostname: async () => [{ address: "10.0.0.8", family: 4 }],
      }),
    ).rejects.toMatchObject({ code: "UNSAFE_URL" } satisfies Partial<PublicHtmlFetchError>);
    expect(requestCount).toBe(0);
  });

  it("revalidates redirect targets before requesting them", async () => {
    const requestedUrls: string[] = [];
    await expect(
      fetchSafePublicHtml(new URL("https://careers.example.com/job/1"), {
        requestPublicHtml: async (url) => {
          requestedUrls.push(url.toString());
          return {
            body: new Uint8Array(),
            headers: { location: "http://127.0.0.1/admin" },
            statusCode: 302,
          };
        },
        resolveHostname: async (hostname) =>
          hostname === "127.0.0.1" ? [{ address: "127.0.0.1", family: 4 }] : [publicAddress],
      }),
    ).rejects.toMatchObject({ code: "UNSAFE_URL" } satisfies Partial<PublicHtmlFetchError>);
    expect(requestedUrls).toEqual(["https://careers.example.com/job/1"]);
  });

  it("rejects oversized and non-HTML responses", async () => {
    await expect(
      fetchSafePublicHtml(new URL("https://careers.example.com/job/1"), {
        requestPublicHtml: async () => ({
          ...htmlResponse(),
          headers: { "content-length": "1000001", "content-type": "text/html" },
        }),
        resolveHostname: async () => [publicAddress],
      }),
    ).rejects.toMatchObject({ code: "BODY_TOO_LARGE" } satisfies Partial<PublicHtmlFetchError>);

    await expect(
      fetchSafePublicHtml(new URL("https://careers.example.com/job/1"), {
        requestPublicHtml: async () => ({
          ...htmlResponse(),
          body: new Uint8Array(1_000_001),
        }),
        resolveHostname: async () => [publicAddress],
      }),
    ).rejects.toMatchObject({ code: "BODY_TOO_LARGE" } satisfies Partial<PublicHtmlFetchError>);

    await expect(
      fetchSafePublicHtml(new URL("https://careers.example.com/job/1"), {
        requestPublicHtml: async () => ({
          ...htmlResponse(),
          headers: { "content-type": "application/json" },
        }),
        resolveHostname: async () => [publicAddress],
      }),
    ).rejects.toMatchObject({ code: "INVALID_CONTENT_TYPE" } satisfies Partial<PublicHtmlFetchError>);
  });
});
