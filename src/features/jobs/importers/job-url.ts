import { safeExternalUrlSchema } from "@/lib/url";

const GREENHOUSE_JOB_HOSTS = new Set([
  "boards.greenhouse.io",
  "job-boards.greenhouse.io",
]);
const LEVER_JOB_HOSTS: ReadonlyMap<string, "EU" | "GLOBAL"> = new Map([
  ["jobs.lever.co", "GLOBAL"],
  ["jobs.eu.lever.co", "EU"],
] as const);

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

export type DetectedJobImportSource = GreenhouseJobSource | LeverJobSource;

export type JobUrlDetectionResult =
  | { source: DetectedJobImportSource; success: true }
  | {
      error: {
        code: "INVALID_URL" | "UNSUPPORTED_SOURCE";
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

  const url = new URL(parsedUrl.data);
  const greenhouseSource = getGreenhouseJobSource(url, parsedUrl.data);

  if (greenhouseSource) {
    return { source: greenhouseSource, success: true };
  }

  const leverSource = getLeverJobSource(url, parsedUrl.data);

  if (leverSource) {
    return { source: leverSource, success: true };
  }

  return {
    error: {
      code: "UNSUPPORTED_SOURCE",
      message: "This job URL source is not supported yet.",
    },
    success: false,
  };
}
