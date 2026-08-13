import { parseDocument } from "htmlparser2";

import { safeExternalUrlSchema } from "@/lib/url";
import { normalizeImportedEmploymentType } from "@/features/jobs/importers/employment-type";
import { normalizeImportedHtmlToPlainText } from "@/features/jobs/importers/html-to-plain-text";
import type { JsonLdJobSource } from "@/features/jobs/importers/job-url";
import {
  fetchSafePublicHtml,
  PublicHtmlFetchError,
} from "@/features/jobs/importers/safe-public-html-fetch";
import type { JobImportResult, JobImportWarning } from "@/features/jobs/importers/types";
import { inferImportedRemoteType } from "@/features/jobs/importers/work-mode";
import { jobImportSeedSchema, type JobImportSeed } from "@/features/jobs/schemas";

type JsonLdObject = Record<string, unknown>;

export type JsonLdHtmlFetcher = (url: URL) => Promise<{
  finalUrl: URL;
  html: string;
}>;

function isJsonLdObject(value: unknown): value is JsonLdObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function hasJobPostingType(value: unknown) {
  const types = Array.isArray(value) ? value : [value];
  return types.some(
    (type) =>
      typeof type === "string" && type.trim().toLocaleLowerCase().endsWith("jobposting"),
  );
}

function collectJobPostingObjects(value: unknown, candidates: JsonLdObject[]) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectJobPostingObjects(item, candidates));
    return;
  }
  if (!isJsonLdObject(value)) {
    return;
  }

  if (hasJobPostingType(value["@type"])) {
    candidates.push(value);
  }
  if (value["@graph"]) {
    collectJobPostingObjects(value["@graph"], candidates);
  }
}

function getScriptText(node: ReturnType<typeof parseDocument>["children"][number]) {
  if (node.type !== "tag" && node.type !== "script") {
    return "";
  }

  return node.children
    .filter((child) => child.type === "text")
    .map((child) => child.data)
    .join("");
}

function collectJsonLdScripts(html: string) {
  const document = parseDocument(html, { decodeEntities: true });
  const scripts: string[] = [];

  const visit = (nodes: ReturnType<typeof parseDocument>["children"]) => {
    for (const node of nodes) {
      if (
        (node.type === "tag" || node.type === "script") &&
        node.name.toLocaleLowerCase() === "script" &&
        node.attribs.type?.split(";", 1)[0]?.trim().toLocaleLowerCase() ===
          "application/ld+json"
      ) {
        scripts.push(getScriptText(node));
      }
      if ((node.type === "tag" || node.type === "script") && node.children.length > 0) {
        visit(node.children);
      }
    }
  };

  visit(document.children);
  return scripts;
}

function extractJobPostingFromHtml(html: string) {
  const candidates: JsonLdObject[] = [];
  let malformedScriptCount = 0;

  for (const script of collectJsonLdScripts(html)) {
    try {
      collectJobPostingObjects(JSON.parse(script), candidates);
    } catch {
      malformedScriptCount += 1;
    }
  }

  return { candidates, malformedScriptCount };
}

function getLocationName(value: unknown) {
  if (typeof value === "string") {
    return getNonEmptyString(value);
  }
  if (!isJsonLdObject(value)) {
    return undefined;
  }

  const address = isJsonLdObject(value.address) ? value.address : value;
  const addressCountry = isJsonLdObject(address.addressCountry)
    ? getNonEmptyString(address.addressCountry.name)
    : getNonEmptyString(address.addressCountry);
  const locationParts = [
    getNonEmptyString(address.addressLocality),
    getNonEmptyString(address.addressRegion),
    addressCountry,
  ].filter((part): part is string => Boolean(part));

  return locationParts.length > 0 ? locationParts.join(", ") : undefined;
}

function normalizeJobLocation(value: unknown) {
  const locations = (Array.isArray(value) ? value : [value])
    .map(getLocationName)
    .filter((location): location is string => Boolean(location));

  return locations.length > 0 ? [...new Set(locations)].join(" / ") : undefined;
}

function normalizeStructuredWorkplaceType(value: unknown) {
  const normalizedValue = getNonEmptyString(value)?.toLocaleLowerCase();
  if (normalizedValue === "telecommute" || normalizedValue === "remote") {
    return "remote" as const;
  }
  if (normalizedValue === "hybrid") {
    return "hybrid" as const;
  }
  if (normalizedValue === "on-site" || normalizedValue === "onsite") {
    return "onsite" as const;
  }
  return undefined;
}

function isSupportedSalary(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && Number.isInteger(value);
}

function normalizeBaseSalary(baseSalary: unknown, fallbackCurrency: unknown) {
  if (baseSalary === undefined || baseSalary === null) {
    return { salary: {}, warning: undefined };
  }
  if (!isJsonLdObject(baseSalary)) {
    return {
      salary: {},
      warning: {
        code: "INVALID_BASE_SALARY",
        message: "The structured salary could not be imported and was omitted.",
      } satisfies JobImportWarning,
    };
  }

  const quantitativeValue = isJsonLdObject(baseSalary.value)
    ? baseSalary.value
    : undefined;
  const singleValue = quantitativeValue ? quantitativeValue.value : baseSalary.value;
  const minValue = quantitativeValue?.minValue;
  const maxValue = quantitativeValue?.maxValue;
  const hasSalaryValue = singleValue !== undefined || minValue !== undefined || maxValue !== undefined;

  if (
    !hasSalaryValue ||
    (singleValue !== undefined && !isSupportedSalary(singleValue)) ||
    (minValue !== undefined && !isSupportedSalary(minValue)) ||
    (maxValue !== undefined && !isSupportedSalary(maxValue))
  ) {
    return {
      salary: {},
      warning: {
        code: "INVALID_BASE_SALARY",
        message: "The structured salary could not be imported and was omitted.",
      } satisfies JobImportWarning,
    };
  }

  const salaryMin = minValue ?? singleValue;
  const salaryMax = maxValue ?? singleValue;
  if (
    (salaryMin !== undefined && !isSupportedSalary(salaryMin)) ||
    (salaryMax !== undefined && !isSupportedSalary(salaryMax)) ||
    (salaryMin !== undefined && salaryMax !== undefined && salaryMin > salaryMax)
  ) {
    return {
      salary: {},
      warning: {
        code: "INVALID_BASE_SALARY",
        message: "The structured salary could not be imported and was omitted.",
      } satisfies JobImportWarning,
    };
  }

  const currency = getNonEmptyString(baseSalary.currency) ?? getNonEmptyString(fallbackCurrency);
  return {
    salary: {
      ...(salaryMin !== undefined ? { salaryMin } : {}),
      ...(salaryMax !== undefined ? { salaryMax } : {}),
      ...(currency ? { salaryCurrency: currency } : {}),
    },
    warning: undefined,
  };
}

function normalizeDeadline(value: unknown) {
  const dateValue = getNonEmptyString(value);
  if (!dateValue) {
    return { deadline: undefined, warning: undefined };
  }

  const deadline = new Date(dateValue);
  if (Number.isNaN(deadline.getTime())) {
    return {
      deadline: undefined,
      warning: {
        code: "INVALID_APPLICATION_DEADLINE",
        message: "The structured application deadline was invalid and was omitted.",
      } satisfies JobImportWarning,
    };
  }

  return { deadline, warning: undefined };
}

function normalizeExternalJobUrl(value: unknown, fallback: string) {
  const urlValue = getNonEmptyString(value);
  if (!urlValue) {
    return { url: fallback, warning: undefined };
  }

  const parsedUrl = safeExternalUrlSchema.safeParse(urlValue);
  if (!parsedUrl.success) {
    return {
      url: fallback,
      warning: {
        code: "INVALID_EXTERNAL_URL",
        message: "The structured job URL was invalid; the submitted URL will be used instead.",
      } satisfies JobImportWarning,
    };
  }

  const url = new URL(parsedUrl.data);
  if (url.username || url.password) {
    return {
      url: fallback,
      warning: {
        code: "INVALID_EXTERNAL_URL",
        message: "The structured job URL was invalid; the submitted URL will be used instead.",
      } satisfies JobImportWarning,
    };
  }
  url.hash = "";
  return { url: url.toString(), warning: undefined };
}

function toJobImportSeed(source: JsonLdJobSource, jobPosting: JsonLdObject) {
  const warnings: JobImportWarning[] = [];
  const title = getNonEmptyString(jobPosting.title);
  const company = isJsonLdObject(jobPosting.hiringOrganization)
    ? getNonEmptyString(jobPosting.hiringOrganization.name)
    : undefined;
  const descriptionValue = getNonEmptyString(jobPosting.description);
  const location = normalizeJobLocation(jobPosting.jobLocation);
  const remoteType = inferImportedRemoteType({
    description: descriptionValue,
    location,
    workplaceType: normalizeStructuredWorkplaceType(jobPosting.jobLocationType),
  });
  const employmentTypeValue = Array.isArray(jobPosting.employmentType)
    ? jobPosting.employmentType.find((value) => Boolean(normalizeImportedEmploymentType(getNonEmptyString(value))))
    : jobPosting.employmentType;
  const employmentType = normalizeImportedEmploymentType(getNonEmptyString(employmentTypeValue));
  const normalizedUrl = normalizeExternalJobUrl(jobPosting.url, source.canonicalUrl);
  const normalizedSalary = normalizeBaseSalary(jobPosting.baseSalary, jobPosting.salaryCurrency);
  const normalizedDeadline = normalizeDeadline(jobPosting.validThrough);

  if (normalizedUrl.warning) {
    warnings.push(normalizedUrl.warning);
  }
  if (normalizedSalary.warning) {
    warnings.push(normalizedSalary.warning);
  }
  if (normalizedDeadline.warning) {
    warnings.push(normalizedDeadline.warning);
  }

  const seed: JobImportSeed = {
    title,
    source: "JSON-LD",
    url: normalizedUrl.url,
    ...(company ? { company } : {}),
    ...(descriptionValue ? { description: normalizeImportedHtmlToPlainText(descriptionValue) } : {}),
    ...(location ? { location } : {}),
    ...(remoteType ? { remoteType } : {}),
    ...(employmentType ? { employmentType } : {}),
    ...normalizedSalary.salary,
    ...(normalizedDeadline.deadline ? { deadline: normalizedDeadline.deadline } : {}),
  };

  return { seed, warnings };
}

export async function importJsonLdJob(
  source: JsonLdJobSource,
  fetchHtml: JsonLdHtmlFetcher = fetchSafePublicHtml,
): Promise<JobImportResult> {
  try {
    const { html } = await fetchHtml(new URL(source.canonicalUrl));
    const { candidates, malformedScriptCount } = extractJobPostingFromHtml(html);

    if (candidates.length === 0) {
      return {
        error: {
          code: "UNSUPPORTED_SOURCE",
          message: "No supported structured job data was found on this page.",
        },
        success: false,
      };
    }

    const { seed, warnings } = toJobImportSeed(source, candidates[0]);
    if (malformedScriptCount > 0) {
      warnings.push({
        code: "MALFORMED_JSON_LD",
        message: "Some structured data on this page was malformed and was ignored.",
      });
    }
    if (candidates.length > 1) {
      warnings.push({
        code: "MULTIPLE_JOB_POSTINGS",
        message: "Multiple job postings were found; the first structured posting was imported.",
      });
    }

    if (!seed.title) {
      return {
        error: {
          code: "MALFORMED_EXTERNAL_DATA",
          message: "The structured job data did not include a usable title.",
        },
        success: false,
      };
    }

    const parsedSeed = jobImportSeedSchema.safeParse(seed);
    if (!parsedSeed.success) {
      return {
        error: {
          code: "INVALID_DRAFT",
          message: "The structured job data could not be imported.",
        },
        success: false,
      };
    }

    return { seed: parsedSeed.data, source, success: true, warnings };
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
        message: "The job posting could not be retrieved.",
      },
      success: false,
    };
  }
}
