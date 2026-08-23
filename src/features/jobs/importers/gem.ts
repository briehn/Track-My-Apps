import { z } from "zod";

import {
  getInferredCompanyWarning,
  getSuggestedCompanyFromIdentifier,
} from "@/features/jobs/importers/company-inference";
import { normalizeImportedEmploymentType } from "@/features/jobs/importers/employment-type";
import { normalizeImportedHtmlToPlainText } from "@/features/jobs/importers/html-to-plain-text";
import type { GemJobSource } from "@/features/jobs/importers/job-url";
import type { JobImportResult, JobImportWarning } from "@/features/jobs/importers/types";
import { inferImportedRemoteType } from "@/features/jobs/importers/work-mode";
import { jobImportSeedSchema, type JobImportSeed } from "@/features/jobs/schemas";

const GEM_API_ORIGIN = "https://api.gem.com";
const GEM_MAX_RESPONSE_BYTES = 1_000_000;
const GEM_REQUEST_TIMEOUT_MS = 10_000;

const gemJobResponseSchema = z.object({
  absolute_url: z.unknown().optional(),
  content: z.unknown().optional(),
  content_plain: z.unknown().optional(),
  employment_type: z.unknown().optional(),
  location: z
    .object({
      name: z.unknown().optional(),
    })
    .nullable()
    .optional(),
  location_type: z.unknown().optional(),
  title: z.string(),
});

export type GemJsonFetcher = (url: URL) => Promise<unknown>;

function getGemApiUrl(source: GemJobSource) {
  const apiUrl = new URL(
    `/job_board/v0/${encodeURIComponent(source.board)}/job_posts/${encodeURIComponent(source.postingId)}`,
    GEM_API_ORIGIN,
  );

  if (apiUrl.origin !== GEM_API_ORIGIN) {
    throw new Error("Gem API URL must use the configured API origin.");
  }

  return apiUrl;
}

async function fetchGemJson(url: URL): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    redirect: "error",
    signal: AbortSignal.timeout(GEM_REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Gem returned ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLocaleLowerCase().includes("application/json")) {
    throw new Error("Gem returned an unexpected response type.");
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength && Number(contentLength) > GEM_MAX_RESPONSE_BYTES) {
    throw new Error("Gem returned a response that is too large.");
  }

  const responseBytes = new Uint8Array(await response.arrayBuffer());
  if (responseBytes.byteLength > GEM_MAX_RESPONSE_BYTES) {
    throw new Error("Gem returned a response that is too large.");
  }

  try {
    return JSON.parse(new TextDecoder().decode(responseBytes));
  } catch {
    throw new Error("Gem returned malformed JSON.");
  }
}

function getNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeGemUrl(value: unknown, source: GemJobSource) {
  const submittedUrl = new URL(source.canonicalUrl);
  const absoluteUrl = getNonEmptyString(value);

  if (!absoluteUrl) {
    return { url: source.canonicalUrl, warning: undefined };
  }

  try {
    const parsedUrl = new URL(absoluteUrl);
    const expectedPath = `/${source.board}/${source.postingId}`;

    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.hostname.toLocaleLowerCase() !== "jobs.gem.com" ||
      parsedUrl.pathname !== expectedPath
    ) {
      throw new Error("Unexpected Gem job URL");
    }

    parsedUrl.search = submittedUrl.search;
    parsedUrl.hash = "";
    return { url: parsedUrl.toString(), warning: undefined };
  } catch {
    return {
      url: source.canonicalUrl,
      warning: {
        code: "INVALID_EXTERNAL_URL",
        message: "Gem returned an unexpected job URL; the submitted URL will be used instead.",
      } satisfies JobImportWarning,
    };
  }
}

function normalizeGemWorkplaceType(value: unknown) {
  const normalizedValue = getNonEmptyString(value)
    ?.toLocaleLowerCase()
    .replace(/[_-]+/g, " ")
    .trim();

  switch (normalizedValue) {
    case "remote":
      return "remote" as const;
    case "hybrid":
      return "hybrid" as const;
    case "in office":
    case "on site":
    case "onsite":
      return "onsite" as const;
    default:
      return undefined;
  }
}

function toJobImportSeed(
  source: GemJobSource,
  response: z.infer<typeof gemJobResponseSchema>,
) {
  const warnings: JobImportWarning[] = [];
  const normalizedUrl = normalizeGemUrl(response.absolute_url, source);
  const contentPlain = getNonEmptyString(response.content_plain);
  const contentHtml = getNonEmptyString(response.content);
  const description = contentPlain ??
    (contentHtml ? normalizeImportedHtmlToPlainText(contentHtml) : undefined);
  const location = getNonEmptyString(response.location?.name);
  const employmentType = normalizeImportedEmploymentType(getNonEmptyString(response.employment_type));
  const remoteType = inferImportedRemoteType({
    description,
    location,
    workplaceType: normalizeGemWorkplaceType(response.location_type),
  });

  if (normalizedUrl.warning) {
    warnings.push(normalizedUrl.warning);
  }
  warnings.push(getInferredCompanyWarning("Gem", "board identifier"));

  const seed: JobImportSeed = {
    company: getSuggestedCompanyFromIdentifier(source.board),
    title: response.title,
    source: "Gem",
    url: normalizedUrl.url,
    ...(description ? { description } : {}),
    ...(location ? { location } : {}),
    ...(employmentType ? { employmentType } : {}),
    ...(remoteType ? { remoteType } : {}),
  };

  return { seed, warnings };
}

export async function importGemJob(
  source: GemJobSource,
  fetchJson: GemJsonFetcher = fetchGemJson,
): Promise<JobImportResult> {
  try {
    const rawResponse = await fetchJson(getGemApiUrl(source));
    const parsedResponse = gemJobResponseSchema.safeParse(rawResponse);

    if (!parsedResponse.success) {
      return {
        error: {
          code: "MALFORMED_EXTERNAL_DATA",
          message: "Gem returned job data in an unexpected format.",
        },
        success: false,
      };
    }

    const { seed, warnings } = toJobImportSeed(source, parsedResponse.data);
    const parsedSeed = jobImportSeedSchema.safeParse(seed);

    if (!parsedSeed.success) {
      return {
        error: {
          code: "INVALID_DRAFT",
          message: "Gem did not provide usable job details.",
        },
        success: false,
      };
    }

    return { seed: parsedSeed.data, source, success: true, warnings };
  } catch {
    return {
      error: {
        code: "EXTRACTION_FAILED",
        message: "The Gem job could not be retrieved.",
      },
      success: false,
    };
  }
}
