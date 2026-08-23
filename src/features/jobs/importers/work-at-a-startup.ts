import { parseDocument } from "htmlparser2";
import { z } from "zod";

import { normalizeImportedEmploymentType } from "@/features/jobs/importers/employment-type";
import { normalizeImportedHtmlToPlainText } from "@/features/jobs/importers/html-to-plain-text";
import type { WorkAtAStartupJobSource } from "@/features/jobs/importers/job-url";
import {
  fetchSafePublicHtml,
  PublicHtmlFetchError,
} from "@/features/jobs/importers/safe-public-html-fetch";
import type { JobImportResult } from "@/features/jobs/importers/types";
import { jobImportSeedSchema, type JobImportSeed } from "@/features/jobs/schemas";

const WORK_AT_A_STARTUP_ORIGIN = "https://www.workatastartup.com";
const WORK_AT_A_STARTUP_JOB_COMPONENT = "jobs/public/pages/JobDetailPage";

const workAtAStartupJobSchema = z.object({
  descriptionHtml: z.unknown().optional(),
  id: z.number().int().positive(),
  jobType: z.unknown().optional(),
  location: z.unknown().optional(),
  title: z.unknown(),
});

const workAtAStartupPageSchema = z.object({
  component: z.literal(WORK_AT_A_STARTUP_JOB_COMPONENT),
  props: z.object({
    company: z.object({ name: z.unknown() }),
    job: workAtAStartupJobSchema,
  }),
  url: z.unknown(),
});

export type WorkAtAStartupHtmlFetcher = (url: URL) => Promise<{
  finalUrl: URL;
  html: string;
}>;

function getNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getWorkAtAStartupFetchUrl(source: WorkAtAStartupJobSource) {
  const url = new URL(`/jobs/${source.jobId}`, WORK_AT_A_STARTUP_ORIGIN);

  if (url.origin !== WORK_AT_A_STARTUP_ORIGIN) {
    throw new Error("Work at a Startup job URL must use the configured origin.");
  }

  return url;
}

function hasExpectedJobUrl(value: unknown, source: WorkAtAStartupJobSource) {
  const pageUrl = getNonEmptyString(value);
  if (!pageUrl) {
    return false;
  }

  try {
    const parsedUrl = new URL(pageUrl, WORK_AT_A_STARTUP_ORIGIN);
    return (
      parsedUrl.origin === WORK_AT_A_STARTUP_ORIGIN &&
      parsedUrl.pathname === `/jobs/${source.jobId}` &&
      !parsedUrl.username &&
      !parsedUrl.password
    );
  } catch {
    return false;
  }
}

function getDataPageAttribute(html: string) {
  const document = parseDocument(html, { decodeEntities: true });

  const visit = (nodes: ReturnType<typeof parseDocument>["children"]): string | undefined => {
    for (const node of nodes) {
      if (
        (node.type === "tag" || node.type === "script") &&
        typeof node.attribs["data-page"] === "string"
      ) {
        return node.attribs["data-page"];
      }

      if ((node.type === "tag" || node.type === "script") && node.children.length > 0) {
        const dataPage = visit(node.children);
        if (dataPage !== undefined) {
          return dataPage;
        }
      }
    }

    return undefined;
  };

  return visit(document.children);
}

export function normalizeWorkAtAStartupLocation(value: unknown) {
  const sourceLocation = getNonEmptyString(value);
  if (!sourceLocation) {
    return {};
  }

  let hasHybridMarker = false;
  let hasRemoteMarker = false;
  const physicalLocations: string[] = [];

  for (const component of sourceLocation.split("/")) {
    const location = component.trim();
    if (!location) {
      continue;
    }

    if (/^remote(?:\s*\([^)]*\))?$/i.test(location)) {
      hasRemoteMarker = true;
      continue;
    }

    if (/^hybrid(?:\s*\([^)]*\))?$/i.test(location)) {
      hasHybridMarker = true;
      continue;
    }

    if (/\(hybrid\)/i.test(location)) {
      hasHybridMarker = true;
    }
    physicalLocations.push(location);
  }

  return {
    ...(physicalLocations.length > 0 ? { location: physicalLocations.join(" / ") } : {}),
    ...(hasHybridMarker
      ? { remoteType: "HYBRID" as const }
      : hasRemoteMarker
        ? { remoteType: "REMOTE" as const }
        : {}),
  };
}

function toJobImportSeed(
  source: WorkAtAStartupJobSource,
  page: z.infer<typeof workAtAStartupPageSchema>,
) {
  const job = page.props.job;
  const title = getNonEmptyString(job.title);
  const company = getNonEmptyString(page.props.company.name);
  const descriptionHtml = getNonEmptyString(job.descriptionHtml);
  const employmentType = normalizeImportedEmploymentType(getNonEmptyString(job.jobType));
  const location = normalizeWorkAtAStartupLocation(job.location);

  const seed: JobImportSeed = {
    company,
    source: "Work at a Startup",
    title,
    url: getWorkAtAStartupFetchUrl(source).toString(),
    ...(descriptionHtml ? { description: normalizeImportedHtmlToPlainText(descriptionHtml) } : {}),
    ...(employmentType ? { employmentType } : {}),
    ...location,
  };

  return seed;
}

export function importWorkAtAStartupJobFromHtml(
  source: WorkAtAStartupJobSource,
  html: string,
): JobImportResult {
  const dataPage = getDataPageAttribute(html);
  if (!dataPage) {
    return {
      error: {
        code: "MALFORMED_EXTERNAL_DATA",
        message: "Work at a Startup did not include the expected job data.",
      },
      success: false,
    };
  }

  let rawPage: unknown;
  try {
    rawPage = JSON.parse(dataPage);
  } catch {
    return {
      error: {
        code: "MALFORMED_EXTERNAL_DATA",
        message: "Work at a Startup returned malformed job data.",
      },
      success: false,
    };
  }

  const parsedPage = workAtAStartupPageSchema.safeParse(rawPage);
  if (
    !parsedPage.success ||
    String(parsedPage.data.props.job.id) !== source.jobId ||
    !hasExpectedJobUrl(parsedPage.data.url, source) ||
    !getNonEmptyString(parsedPage.data.props.job.title) ||
    !getNonEmptyString(parsedPage.data.props.company.name)
  ) {
    return {
      error: {
        code: "MALFORMED_EXTERNAL_DATA",
        message: "Work at a Startup returned job data in an unexpected format.",
      },
      success: false,
    };
  }

  const seed = toJobImportSeed(source, parsedPage.data);
  const parsedSeed = jobImportSeedSchema.safeParse(seed);
  if (!parsedSeed.success) {
    return {
      error: {
        code: "INVALID_DRAFT",
        message: "Work at a Startup did not provide usable job details.",
      },
      success: false,
    };
  }

  return { seed: parsedSeed.data, source, success: true, warnings: [] };
}

export async function importWorkAtAStartupJob(
  source: WorkAtAStartupJobSource,
  fetchHtml: WorkAtAStartupHtmlFetcher = fetchSafePublicHtml,
): Promise<JobImportResult> {
  try {
    const expectedUrl = getWorkAtAStartupFetchUrl(source);
    const { finalUrl, html } = await fetchHtml(expectedUrl);
    if (
      finalUrl.origin !== WORK_AT_A_STARTUP_ORIGIN ||
      finalUrl.pathname !== expectedUrl.pathname ||
      finalUrl.username ||
      finalUrl.password
    ) {
      throw new Error("Work at a Startup redirected away from the expected job page.");
    }

    return importWorkAtAStartupJobFromHtml(source, html);
  } catch (error) {
    if (error instanceof PublicHtmlFetchError && error.code === "UNSAFE_URL") {
      return {
        error: {
          code: "UNSAFE_URL",
          message: "This URL can't be imported.",
        },
        success: false,
      };
    }

    return {
      error: {
        code: "EXTRACTION_FAILED",
        message: "The Work at a Startup job could not be retrieved.",
      },
      success: false,
    };
  }
}
