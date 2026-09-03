import { z } from "zod";

import { normalizeImportedEmploymentType } from "@/features/jobs/importers/employment-type";
import { normalizeImportedHtmlToPlainText } from "@/features/jobs/importers/html-to-plain-text";
import type { DoverJobSource } from "@/features/jobs/importers/job-url";
import {
  fetchSafePublicJson,
  PublicHtmlFetchError,
} from "@/features/jobs/importers/safe-public-html-fetch";
import type { JobImportResult } from "@/features/jobs/importers/types";
import { jobImportSeedSchema, type JobImportSeed } from "@/features/jobs/schemas";

const DOVER_API_ORIGIN = "https://app.dover.com";

const doverLocationSchema = z.object({
  location_type: z.string().optional(),
  name: z.string().optional(),
});

const doverCompensationSchema = z.object({
  currency_code: z.unknown().optional(),
  employment_type: z.unknown().optional(),
  lower_bound: z.unknown().optional(),
  open_to_sharing_comp: z.unknown().optional(),
  salary_range_type: z.unknown().optional(),
  upper_bound: z.unknown().optional(),
});

const doverJobResponseSchema = z.object({
  client_name: z.string(),
  compensation: doverCompensationSchema.nullable().optional().catch(undefined),
  id: z.string(),
  locations: z.array(doverLocationSchema).optional().catch(undefined),
  title: z.string(),
  user_provided_description: z.unknown().optional(),
  workplace_type: z.unknown().optional(),
});

type DoverJobResponse = z.infer<typeof doverJobResponseSchema>;

export type DoverJsonFetcher = (url: URL) => Promise<{
  json: unknown;
  statusCode: number;
}>;

function getDoverApiUrl(source: DoverJobSource) {
  const apiUrl = new URL(
    `/api/v1/inbound/application-portal-job/${encodeURIComponent(source.postingId)}`,
    DOVER_API_ORIGIN,
  );

  if (apiUrl.origin !== DOVER_API_ORIGIN) {
    throw new Error("Dover API URL must use the configured API origin.");
  }

  return apiUrl;
}

async function fetchDoverJson(url: URL) {
  return fetchSafePublicJson(url, {}, { acceptedStatusCodes: [404] });
}

function getNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeDoverWorkplaceType(value: unknown) {
  switch (getNonEmptyString(value)?.toLocaleUpperCase()) {
    case "REMOTE":
      return "REMOTE" as const;
    case "HYBRID":
      return "HYBRID" as const;
    case "ONSITE":
      return "ONSITE" as const;
    default:
      return undefined;
  }
}

function normalizePhysicalLocations(locations: DoverJobResponse["locations"]) {
  if (!locations) {
    return undefined;
  }

  const physicalLocations = locations
    .filter((location) => location.location_type?.toLocaleUpperCase() !== "REMOTE")
    .map((location) => getNonEmptyString(location.name))
    .filter((location): location is string => Boolean(location));

  const uniqueLocations = [...new Set(physicalLocations)];
  return uniqueLocations.length > 0 ? uniqueLocations.join(" / ") : undefined;
}

function isValidSalaryAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function normalizeDoverSalary(compensation: DoverJobResponse["compensation"]) {
  if (
    !compensation ||
    compensation.open_to_sharing_comp !== true ||
    compensation.salary_range_type !== "YEARLY"
  ) {
    return {};
  }

  const currency = getNonEmptyString(compensation.currency_code)?.toLocaleUpperCase();
  const hasLowerBound = compensation.lower_bound !== undefined && compensation.lower_bound !== null;
  const hasUpperBound = compensation.upper_bound !== undefined && compensation.upper_bound !== null;

  if (
    !currency ||
    !/^[A-Z]{3}$/.test(currency) ||
    (!hasLowerBound && !hasUpperBound) ||
    (hasLowerBound && !isValidSalaryAmount(compensation.lower_bound)) ||
    (hasUpperBound && !isValidSalaryAmount(compensation.upper_bound))
  ) {
    return {};
  }

  const salaryMin = isValidSalaryAmount(compensation.lower_bound)
    ? compensation.lower_bound
    : undefined;
  const salaryMax = isValidSalaryAmount(compensation.upper_bound)
    ? compensation.upper_bound
    : undefined;
  if (salaryMin !== undefined && salaryMax !== undefined && salaryMin > salaryMax) {
    return {};
  }

  return {
    ...(salaryMin !== undefined ? { salaryMin } : {}),
    ...(salaryMax !== undefined ? { salaryMax } : {}),
    salaryCurrency: currency,
  };
}

function getCanonicalDoverApplicationUrl(source: DoverJobSource, company: string, postingId: string) {
  const canonicalUrl = new URL(source.canonicalUrl);
  canonicalUrl.pathname = `/apply/${encodeURIComponent(company)}/${encodeURIComponent(postingId)}`;
  canonicalUrl.hash = "";
  return canonicalUrl.toString();
}

function toJobImportSeed(source: DoverJobSource, response: DoverJobResponse) {
  const company = getNonEmptyString(response.client_name);
  const title = getNonEmptyString(response.title);

  if (!company || !title || response.id.toLocaleLowerCase() !== source.postingId) {
    return undefined;
  }

  const description = getNonEmptyString(response.user_provided_description);
  const location = normalizePhysicalLocations(response.locations);
  const remoteType = normalizeDoverWorkplaceType(response.workplace_type);
  const employmentType = normalizeImportedEmploymentType(
    getNonEmptyString(response.compensation?.employment_type),
  );
  const salary = normalizeDoverSalary(response.compensation);

  const seed: JobImportSeed = {
    company,
    source: "Dover",
    title,
    url: getCanonicalDoverApplicationUrl(source, company, response.id.toLocaleLowerCase()),
    ...(description ? { description: normalizeImportedHtmlToPlainText(description) } : {}),
    ...(location ? { location } : {}),
    ...(remoteType ? { remoteType } : {}),
    ...(employmentType ? { employmentType } : {}),
    ...salary,
  };

  return seed;
}

export async function importDoverJob(
  source: DoverJobSource,
  fetchJson: DoverJsonFetcher = fetchDoverJson,
): Promise<JobImportResult> {
  try {
    const response = await fetchJson(getDoverApiUrl(source));

    if (response.statusCode === 404) {
      return {
        error: {
          code: "POSTING_UNAVAILABLE",
          message: "This Dover job posting is no longer available.",
        },
        success: false,
      };
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      return {
        error: {
          code: "EXTRACTION_FAILED",
          message: "The Dover job could not be retrieved.",
        },
        success: false,
      };
    }

    const parsedResponse = doverJobResponseSchema.safeParse(response.json);
    if (!parsedResponse.success) {
      return {
        error: {
          code: "MALFORMED_EXTERNAL_DATA",
          message: "Dover returned job data in an unexpected format.",
        },
        success: false,
      };
    }

    const seed = toJobImportSeed(source, parsedResponse.data);
    if (!seed || !jobImportSeedSchema.safeParse(seed).success) {
      return {
        error: {
          code: "MALFORMED_EXTERNAL_DATA",
          message: "Dover returned job data in an unexpected format.",
        },
        success: false,
      };
    }

    return { seed, source, success: true, warnings: [] };
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
        message: "The Dover job could not be retrieved.",
      },
      success: false,
    };
  }
}
