import { z } from "zod";

import { normalizeImportedEmploymentType } from "@/features/jobs/importers/employment-type";
import type { FourDayWeekJobSource } from "@/features/jobs/importers/job-url";
import type { JobImportResult, JobImportWarning } from "@/features/jobs/importers/types";
import { inferImportedRemoteType } from "@/features/jobs/importers/work-mode";
import { jobImportSeedSchema, type JobImportSeed } from "@/features/jobs/schemas";

const FOUR_DAY_WEEK_API_ORIGIN = "https://4dayweek.io";
const FOUR_DAY_WEEK_MAX_RESPONSE_BYTES = 1_000_000;
const FOUR_DAY_WEEK_REQUEST_TIMEOUT_MS = 10_000;

const fourDayWeekJobResponseSchema = z.object({
  company: z
    .object({
      name: z.unknown().optional(),
    })
    .nullable()
    .optional()
    .catch(undefined),
  contract_type: z.unknown().optional(),
  description: z.unknown().optional(),
  locations: z.unknown().optional(),
  salary_currency: z.unknown().optional(),
  salary_max: z.unknown().optional(),
  salary_min: z.unknown().optional(),
  salary_period: z.unknown().optional(),
  title: z.string(),
  url: z.unknown().optional(),
  work_arrangement: z.unknown().optional(),
});

type FourDayWeekJobResponse = z.infer<typeof fourDayWeekJobResponseSchema>;

export type FourDayWeekJsonFetcher = (url: URL) => Promise<unknown>;

function getFourDayWeekApiUrl(source: FourDayWeekJobSource) {
  const apiUrl = new URL(
    `/api/v2/jobs/${encodeURIComponent(source.slug)}`,
    FOUR_DAY_WEEK_API_ORIGIN,
  );

  if (apiUrl.origin !== FOUR_DAY_WEEK_API_ORIGIN) {
    throw new Error("4 Day Week API URL must use the configured API origin.");
  }

  return apiUrl;
}

async function fetchFourDayWeekJson(url: URL): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    redirect: "error",
    signal: AbortSignal.timeout(FOUR_DAY_WEEK_REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`4 Day Week returned ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLocaleLowerCase().includes("application/json")) {
    throw new Error("4 Day Week returned an unexpected response type.");
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength && Number(contentLength) > FOUR_DAY_WEEK_MAX_RESPONSE_BYTES) {
    throw new Error("4 Day Week returned a response that is too large.");
  }

  const responseBytes = new Uint8Array(await response.arrayBuffer());
  if (responseBytes.byteLength > FOUR_DAY_WEEK_MAX_RESPONSE_BYTES) {
    throw new Error("4 Day Week returned a response that is too large.");
  }

  try {
    return JSON.parse(new TextDecoder().decode(responseBytes));
  } catch {
    throw new Error("4 Day Week returned malformed JSON.");
  }
}

function getNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getLocationName(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  const location = value as Record<string, unknown>;
  const parts = [location.city, location.state, location.country]
    .map(getNonEmptyString)
    .filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(", ") : undefined;
}

function normalizeLocation(value: unknown) {
  const locations = (Array.isArray(value) ? value : [value])
    .map(getLocationName)
    .filter((location): location is string => Boolean(location));

  return locations.length > 0 ? [...new Set(locations)].join(" / ") : undefined;
}

function normalizeWorkArrangement(value: unknown) {
  const normalizedValue = getNonEmptyString(value)?.toLocaleLowerCase().replace(/[_-]+/g, " ").trim();

  switch (normalizedValue) {
    case "remote":
      return "remote" as const;
    case "hybrid":
      return "hybrid" as const;
    case "on site":
    case "onsite":
      return "onsite" as const;
    default:
      return undefined;
  }
}

function getLocationWorkArrangement(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const primaryLocation = value.find((location) => {
    return typeof location === "object" && location !== null && !Array.isArray(location) &&
      (location as Record<string, unknown>).is_primary === true;
  });
  const locationsInPriorityOrder = primaryLocation ? [primaryLocation, ...value] : value;

  return locationsInPriorityOrder
    .map((location) => {
      if (typeof location !== "object" || location === null || Array.isArray(location)) {
        return undefined;
      }
      return normalizeWorkArrangement((location as Record<string, unknown>).work_arrangement);
    })
    .find(Boolean);
}

function normalizeFourDayWeekUrl(value: unknown, source: FourDayWeekJobSource) {
  const apiUrl = getNonEmptyString(value);
  if (!apiUrl) {
    return { url: source.canonicalUrl, warning: undefined };
  }

  try {
    const parsedUrl = new URL(apiUrl);
    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.hostname.toLocaleLowerCase() !== "4dayweek.io" ||
      parsedUrl.pathname !== `/job/${source.slug}` ||
      parsedUrl.username ||
      parsedUrl.password
    ) {
      throw new Error("Unexpected 4 Day Week job URL");
    }

    parsedUrl.search = new URL(source.canonicalUrl).search;
    parsedUrl.hash = "";
    return { url: parsedUrl.toString(), warning: undefined };
  } catch {
    return {
      url: source.canonicalUrl,
      warning: {
        code: "INVALID_EXTERNAL_URL",
        message: "4 Day Week returned an unexpected job URL; the submitted URL will be used instead.",
      } satisfies JobImportWarning,
    };
  }
}

function isValidCents(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function normalizeSalary(response: FourDayWeekJobResponse) {
  const hasSalaryData =
    response.salary_min !== undefined ||
    response.salary_max !== undefined ||
    response.salary_currency !== undefined ||
    response.salary_period !== undefined;

  if (!hasSalaryData) {
    return { salary: {}, warning: undefined };
  }

  const currency = getNonEmptyString(response.salary_currency)?.toLocaleUpperCase();
  const period = getNonEmptyString(response.salary_period)?.toLocaleLowerCase();
  const min = response.salary_min;
  const max = response.salary_max;

  if (
    currency !== "USD" ||
    period !== "year" ||
    !isValidCents(min) ||
    !isValidCents(max) ||
    min > max ||
    min % 100 !== 0 ||
    max % 100 !== 0
  ) {
    return {
      salary: {},
      warning: {
        code: "INVALID_BASE_SALARY",
        message: "4 Day Week salary could not be represented safely and was omitted.",
      } satisfies JobImportWarning,
    };
  }

  return {
    salary: {
      salaryCurrency: currency,
      salaryMax: max / 100,
      salaryMin: min / 100,
    },
    warning: undefined,
  };
}

function toJobImportSeed(source: FourDayWeekJobSource, response: FourDayWeekJobResponse) {
  const warnings: JobImportWarning[] = [];
  const description = getNonEmptyString(response.description);
  const location = normalizeLocation(response.locations);
  const workplaceType =
    normalizeWorkArrangement(response.work_arrangement) ??
    getLocationWorkArrangement(response.locations);
  const remoteType = inferImportedRemoteType({ description, location, workplaceType });
  const employmentType = normalizeImportedEmploymentType(getNonEmptyString(response.contract_type));
  const normalizedUrl = normalizeFourDayWeekUrl(response.url, source);
  const normalizedSalary = normalizeSalary(response);

  if (normalizedUrl.warning) {
    warnings.push(normalizedUrl.warning);
  }
  if (normalizedSalary.warning) {
    warnings.push(normalizedSalary.warning);
  }

  const seed: JobImportSeed = {
    source: "4 Day Week",
    title: response.title.trim(),
    url: normalizedUrl.url,
    ...(getNonEmptyString(response.company?.name) ? { company: getNonEmptyString(response.company?.name) } : {}),
    ...(description ? { description } : {}),
    ...(employmentType ? { employmentType } : {}),
    ...(location ? { location } : {}),
    ...(remoteType ? { remoteType } : {}),
    ...normalizedSalary.salary,
  };

  return { seed, warnings };
}

export async function importFourDayWeekJob(
  source: FourDayWeekJobSource,
  fetchJson: FourDayWeekJsonFetcher = fetchFourDayWeekJson,
): Promise<JobImportResult> {
  try {
    const rawResponse = await fetchJson(getFourDayWeekApiUrl(source));
    const parsedResponse = fourDayWeekJobResponseSchema.safeParse(rawResponse);

    if (!parsedResponse.success || !parsedResponse.data.title.trim()) {
      return {
        error: {
          code: "MALFORMED_EXTERNAL_DATA",
          message: "4 Day Week returned job data in an unexpected format.",
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
          message: "4 Day Week did not provide usable job details.",
        },
        success: false,
      };
    }

    return { seed: parsedSeed.data, source, success: true, warnings };
  } catch {
    return {
      error: {
        code: "EXTRACTION_FAILED",
        message: "The 4 Day Week job could not be retrieved.",
      },
      success: false,
    };
  }
}
