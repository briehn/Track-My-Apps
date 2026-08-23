import { safeExternalUrlSchema } from "@/lib/url";

const GREENHOUSE_JOB_HOSTS = new Set([
  "boards.greenhouse.io",
  "job-boards.greenhouse.io",
]);
const LEVER_JOB_HOSTS: ReadonlyMap<string, "EU" | "GLOBAL"> = new Map([
  ["jobs.lever.co", "GLOBAL"],
  ["jobs.eu.lever.co", "EU"],
] as const);
const GEM_JOB_HOST = "jobs.gem.com";
const RIPPLING_JOB_HOST = "ats.rippling.com";

export type GreenhouseJobSource = {
  boardToken: string;
  canonicalUrl: string;
  jobId: string;
  kind: "GREENHOUSE";
  submittedUrl: string;
};

export type LeverJobSource = {
  canonicalUrl: string;
  instance: "EU" | "GLOBAL";
  kind: "LEVER";
  postingId: string;
  site: string;
  submittedUrl: string;
};

export type GemJobSource = {
  board: string;
  canonicalUrl: string;
  kind: "GEM";
  postingId: string;
  submittedUrl: string;
};

export type RipplingJobSource = {
  canonicalUrl: string;
  companySlug: string;
  jobId: string;
  kind: "RIPPLING";
  submittedUrl: string;
};

export type JsonLdJobSource = {
  canonicalUrl: string;
  kind: "JSON_LD";
  submittedUrl: string;
};

export type DetectedJobImportSource =
  | GreenhouseJobSource
  | LeverJobSource
  | GemJobSource
  | RipplingJobSource
  | JsonLdJobSource;

export type JobUrlDetectionResult =
  | { source: DetectedJobImportSource; success: true }
  | {
      error: {
        code: "INVALID_URL" | "MALFORMED_URL" | "UNSAFE_URL" | "UNSUPPORTED_SOURCE";
        message: string;
      };
      success: false;
    };

function toCanonicalUrl(url: URL) {
  url.hash = "";
  return url.toString();
}

function getGreenhouseJobSource(
  url: URL,
  submittedUrl: string,
): GreenhouseJobSource | null {
  if (!GREENHOUSE_JOB_HOSTS.has(url.hostname.toLocaleLowerCase())) {
    return null;
  }

  const pathSegments = url.pathname.split("/").filter(Boolean);

  if (
    pathSegments.length !== 3 ||
    pathSegments[1] !== "jobs" ||
    !pathSegments[0] ||
    !/^\d+$/.test(pathSegments[2])
  ) {
    return null;
  }

  let boardToken: string;

  try {
    boardToken = decodeURIComponent(pathSegments[0]);
  } catch {
    return null;
  }

  return {
    boardToken,
    canonicalUrl: toCanonicalUrl(url),
    jobId: pathSegments[2],
    kind: "GREENHOUSE",
    submittedUrl,
  };
}

function getLeverJobSource(url: URL, submittedUrl: string): LeverJobSource | null {
  const instance = LEVER_JOB_HOSTS.get(url.hostname.toLocaleLowerCase());
  const pathSegments = url.pathname.split("/").filter(Boolean);

  if (!instance || pathSegments.length !== 2 || !/^[A-Za-z0-9-]+$/.test(pathSegments[1])) {
    return null;
  }

  let site: string;

  try {
    site = decodeURIComponent(pathSegments[0]);
  } catch {
    return null;
  }

  if (!site) {
    return null;
  }

  return {
    canonicalUrl: toCanonicalUrl(url),
    instance,
    kind: "LEVER",
    postingId: pathSegments[1],
    site,
    submittedUrl,
  };
}

function getGemJobSource(url: URL, submittedUrl: string): GemJobSource | null {
  if (url.hostname.toLocaleLowerCase() !== GEM_JOB_HOST) {
    return null;
  }

  const pathSegments = url.pathname.split("/").filter(Boolean);

  if (
    pathSegments.length !== 2 ||
    !/^[A-Za-z0-9-]+$/.test(pathSegments[0]) ||
    !/^[A-Za-z0-9_-]+$/.test(pathSegments[1])
  ) {
    return null;
  }

  return {
    board: pathSegments[0],
    canonicalUrl: toCanonicalUrl(url),
    kind: "GEM",
    postingId: pathSegments[1],
    submittedUrl,
  };
}

function getRipplingJobSource(url: URL, submittedUrl: string): RipplingJobSource | null {
  if (url.hostname.toLocaleLowerCase() !== RIPPLING_JOB_HOST) {
    return null;
  }

  const pathSegments = url.pathname.split("/").filter(Boolean);

  if (
    pathSegments.length !== 3 ||
    pathSegments[1] !== "jobs" ||
    !/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(pathSegments[0]) ||
    !/^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$/.test(
      pathSegments[2],
    )
  ) {
    return null;
  }

  return {
    canonicalUrl: toCanonicalUrl(url),
    companySlug: pathSegments[0],
    jobId: pathSegments[2],
    kind: "RIPPLING",
    submittedUrl,
  };
}

export function detectJobImportSource(submittedUrl: string): JobUrlDetectionResult {
  const parsedUrl = safeExternalUrlSchema.safeParse(submittedUrl);

  if (!parsedUrl.success) {
    return {
      error: {
        code: "INVALID_URL",
        message: "Enter a valid http:// or https:// job URL.",
      },
      success: false,
    };
  }

  if (parsedUrl.data.includes("\\")) {
    return {
      error: {
        code: "MALFORMED_URL",
        message: "Remove escaped backslashes from the job URL and paste the browser URL directly.",
      },
      success: false,
    };
  }

  const url = new URL(parsedUrl.data);
  if (url.username || url.password) {
    return {
      error: {
        code: "UNSAFE_URL",
        message: "This URL can't be imported.",
      },
      success: false,
    };
  }
  const greenhouseSource = getGreenhouseJobSource(url, parsedUrl.data);

  if (greenhouseSource) {
    return { source: greenhouseSource, success: true };
  }

  const leverSource = getLeverJobSource(url, parsedUrl.data);

  if (leverSource) {
    return { source: leverSource, success: true };
  }

  const gemSource = getGemJobSource(url, parsedUrl.data);

  if (gemSource) {
    return { source: gemSource, success: true };
  }

  const ripplingSource = getRipplingJobSource(url, parsedUrl.data);

  if (ripplingSource) {
    return { source: ripplingSource, success: true };
  }

  if (
    GREENHOUSE_JOB_HOSTS.has(url.hostname.toLocaleLowerCase()) ||
    LEVER_JOB_HOSTS.has(url.hostname.toLocaleLowerCase()) ||
    url.hostname.toLocaleLowerCase() === GEM_JOB_HOST ||
    url.hostname.toLocaleLowerCase() === RIPPLING_JOB_HOST
  ) {
    return {
      error: {
        code: "UNSUPPORTED_SOURCE",
        message: "This job URL source is not supported yet.",
      },
      success: false,
    };
  }

  return {
    source: {
      canonicalUrl: toCanonicalUrl(url),
      kind: "JSON_LD",
      submittedUrl: parsedUrl.data,
    },
    success: true,
  };
}
