import { z } from "zod";

import {
  getInferredCompanyWarning,
  getSuggestedCompanyFromIdentifier,
} from "@/features/jobs/importers/company-inference";
import { normalizeImportedHtmlToPlainText } from "@/features/jobs/importers/html-to-plain-text";
import { normalizeImportedEmploymentType } from "@/features/jobs/importers/employment-type";
import {
  importJsonLdJobFromHtml,
  type JsonLdHtmlFetcher,
} from "@/features/jobs/importers/json-ld";
import type { JsonLdJobSource, LeverJobSource } from "@/features/jobs/importers/job-url";
import {
  fetchSafePublicHtml,
  PublicHtmlFetchError,
} from "@/features/jobs/importers/safe-public-html-fetch";
import type { JobImportResult, JobImportWarning } from "@/features/jobs/importers/types";
import { inferImportedRemoteType } from "@/features/jobs/importers/work-mode";
import { jobImportSeedSchema, type JobImportSeed } from "@/features/jobs/schemas";

const LEVER_API_ORIGINS = {
  EU: "https://api.eu.lever.co",
  GLOBAL: "https://api.lever.co",
} as const;
const LEVER_MAX_RESPONSE_BYTES = 1_000_000;
const LEVER_REQUEST_TIMEOUT_MS = 10_000;

const leverJobResponseSchema = z.object({
  categories: z
    .object({
      commitment: z.string().nullable().optional(),
      location: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  description: z.string().nullable().optional(),
  descriptionPlain: z.string().nullable().optional(),
  hostedUrl: z.string().nullable().optional(),
  salaryRange: z
    .object({
      currency: z.string().nullable().optional(),
      max: z.number().finite().nullable().optional(),
      min: z.number().finite().nullable().optional(),
    })
    .nullable()
    .optional(),
  text: z.string(),
  workplaceType: z
    .enum(["hybrid", "on-site", "onsite", "remote", "unspecified"])
    .nullable()
    .optional(),
});

export type LeverJsonFetcher = (url: URL) => Promise<unknown>;

export class LeverApiNotFoundError extends Error {
  constructor() {
    super("Lever returned 404.");
  }
}

function getLeverApiUrl(source: LeverJobSource) {
  const apiOrigin = LEVER_API_ORIGINS[source.instance];
  const apiUrl = new URL(
    `/v0/postings/${encodeURIComponent(source.site)}/${encodeURIComponent(source.postingId)}`,
    apiOrigin,
  );

  if (apiUrl.origin !== apiOrigin) {
    throw new Error("Lever API URL must use the configured API origin.");
  }

  return apiUrl;
}

async function fetchLeverJson(url: URL): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    redirect: "error",
    signal: AbortSignal.timeout(LEVER_REQUEST_TIMEOUT_MS),
  });

  if (response.status === 404) {
    throw new LeverApiNotFoundError();
  }

  if (!response.ok) {
    throw new Error(`Lever returned ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLocaleLowerCase().includes("application/json")) {
    throw new Error("Lever returned an unexpected response type.");
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength && Number(contentLength) > LEVER_MAX_RESPONSE_BYTES) {
    throw new Error("Lever returned a response that is too large.");
  }

  const responseBytes = new Uint8Array(await response.arrayBuffer());
  if (responseBytes.byteLength > LEVER_MAX_RESPONSE_BYTES) {
    throw new Error("Lever returned a response that is too large.");
  }

  try {
    return JSON.parse(new TextDecoder().decode(responseBytes));
  } catch {
    throw new Error("Lever returned malformed JSON.");
  }
}

function normalizeLeverUrl(value: string | null | undefined, fallback: string) {
  if (!value) {
    return { url: fallback, warning: undefined };
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Unsupported protocol");
    }
    url.hash = "";
    return { url: url.toString(), warning: undefined };
  } catch {
    return {
      url: fallback,
      warning: {
        code: "INVALID_EXTERNAL_URL",
        message: "Lever returned an invalid job URL; the submitted URL will be used instead.",
      } satisfies JobImportWarning,
    };
  }
}

function isValidSalary(value: number | null | undefined): value is number {
  return value !== null && value !== undefined && value >= 0 && Number.isInteger(value);
}

function toJobImportSeed(
  source: LeverJobSource,
  response: z.infer<typeof leverJobResponseSchema>,
) {
  const warnings: JobImportWarning[] = [];
  const normalizedUrl = normalizeLeverUrl(response.hostedUrl, source.canonicalUrl);
  const description = response.descriptionPlain?.trim() ||
    (response.description ? normalizeImportedHtmlToPlainText(response.description) : undefined);
  const employmentType = normalizeImportedEmploymentType(response.categories?.commitment);
  const remoteType = inferImportedRemoteType({
    description,
    location: response.categories?.location,
    workplaceType: response.workplaceType,
  });

  if (normalizedUrl.warning) {
    warnings.push(normalizedUrl.warning);
  }

  const suggestedCompany = getSuggestedCompanyFromIdentifier(source.site);
  warnings.push(getLeverInferredCompanyWarning());

  const seed: JobImportSeed = {
    company: suggestedCompany,
    title: response.text,
    source: "Lever",
    url: normalizedUrl.url,
    ...(response.categories?.location ? { location: response.categories.location } : {}),
    ...(description ? { description } : {}),
    ...(employmentType ? { employmentType } : {}),
    ...(remoteType ? { remoteType } : {}),
    ...(isValidSalary(response.salaryRange?.min) ? { salaryMin: response.salaryRange.min } : {}),
    ...(isValidSalary(response.salaryRange?.max) ? { salaryMax: response.salaryRange.max } : {}),
    ...(response.salaryRange?.currency ? { salaryCurrency: response.salaryRange.currency } : {}),
  };

  return { seed, warnings };
}

function getLeverJsonLdSource(source: LeverJobSource): JsonLdJobSource {
  return {
    canonicalUrl: source.canonicalUrl,
    kind: "JSON_LD",
    submittedUrl: source.submittedUrl,
  };
}

function getLeverInferredCompanyWarning() {
  return getInferredCompanyWarning("Lever", "site identifier");
}

async function importLeverHostedJsonLd(
  source: LeverJobSource,
  fetchHtml: JsonLdHtmlFetcher,
): Promise<JobImportResult> {
  try {
    const { html } = await fetchHtml(new URL(source.canonicalUrl));
    const jsonLdResult = importJsonLdJobFromHtml(getLeverJsonLdSource(source), html);

    if (!jsonLdResult.success) {
      return jsonLdResult;
    }

    const seed: JobImportSeed = {
      ...jsonLdResult.seed,
      company: getSuggestedCompanyFromIdentifier(source.site),
      source: "Lever",
    };
    const parsedSeed = jobImportSeedSchema.safeParse(seed);

    if (!parsedSeed.success) {
      return {
        error: {
          code: "INVALID_DRAFT",
          message: "Lever did not provide usable job details.",
        },
        success: false,
      };
    }

    return {
      seed: parsedSeed.data,
      source,
      success: true,
      warnings: [...jsonLdResult.warnings, getLeverInferredCompanyWarning()],
    };
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
        message: "The Lever job could not be retrieved.",
      },
      success: false,
    };
  }
}

export async function importLeverJob(
  source: LeverJobSource,
  fetchJson: LeverJsonFetcher = fetchLeverJson,
  fetchHtml: JsonLdHtmlFetcher = fetchSafePublicHtml,
): Promise<JobImportResult> {
  try {
    const rawResponse = await fetchJson(getLeverApiUrl(source));
    const parsedResponse = leverJobResponseSchema.safeParse(rawResponse);

    if (!parsedResponse.success) {
      return {
        error: {
          code: "MALFORMED_EXTERNAL_DATA",
          message: "Lever returned job data in an unexpected format.",
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
          message: "Lever did not provide usable job details.",
        },
        success: false,
      };
    }

    return { seed: parsedSeed.data, source, success: true, warnings };
  } catch (error) {
    if (error instanceof LeverApiNotFoundError) {
      return importLeverHostedJsonLd(source, fetchHtml);
    }

    return {
      error: {
        code: "EXTRACTION_FAILED",
        message: "The Lever job could not be retrieved.",
      },
      success: false,
    };
  }
}
