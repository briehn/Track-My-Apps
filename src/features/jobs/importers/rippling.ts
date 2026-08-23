import { parseDocument } from "htmlparser2";
import { z } from "zod";

import {
  getInferredCompanyWarning,
  getSuggestedCompanyFromIdentifier,
} from "@/features/jobs/importers/company-inference";
import { normalizeImportedEmploymentType } from "@/features/jobs/importers/employment-type";
import { normalizeImportedHtmlToPlainText } from "@/features/jobs/importers/html-to-plain-text";
import type { RipplingJobSource } from "@/features/jobs/importers/job-url";
import {
  fetchSafePublicHtml,
  PublicHtmlFetchError,
} from "@/features/jobs/importers/safe-public-html-fetch";
import type { JobImportResult, JobImportWarning } from "@/features/jobs/importers/types";
import { inferImportedRemoteType } from "@/features/jobs/importers/work-mode";
import { jobImportSeedSchema, type JobImportSeed } from "@/features/jobs/schemas";

const ripplingJobPostSchema = z.object({
  companyName: z.unknown().optional(),
  description: z
    .object({
      company: z.unknown().optional(),
      role: z.unknown().optional(),
    })
    .nullable()
    .optional()
    .catch(undefined),
  employmentType: z
    .object({
      id: z.unknown().optional(),
      label: z.unknown().optional(),
    })
    .nullable()
    .optional()
    .catch(undefined),
  name: z.string(),
  payRangeDetails: z.unknown().optional(),
  url: z.unknown().optional(),
  workLocations: z.unknown().optional(),
});

const ripplingNextDataSchema = z.object({
  props: z.object({
    pageProps: z.object({
      apiData: z.object({
        jobPost: ripplingJobPostSchema,
      }),
    }),
  }),
});

const ripplingAnnualPayRangeSchema = z.object({
  currency: z.string(),
  frequency: z.string(),
  rangeEnd: z.number().int().nonnegative(),
  rangeStart: z.number().int().nonnegative(),
});

export type RipplingHtmlFetcher = (url: URL) => Promise<{
  finalUrl: URL;
  html: string;
}>;

function getNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getNextDataScript(html: string) {
  const document = parseDocument(html, { decodeEntities: true });

  const visit = (nodes: ReturnType<typeof parseDocument>["children"]): string | undefined => {
    for (const node of nodes) {
      if (
        (node.type === "tag" || node.type === "script") &&
        node.name.toLocaleLowerCase() === "script" &&
        node.attribs.id === "__NEXT_DATA__" &&
        node.attribs.type?.split(";", 1)[0]?.trim().toLocaleLowerCase() === "application/json"
      ) {
        return node.children
          .filter((child) => child.type === "text")
          .map((child) => child.data)
          .join("");
      }

      if ((node.type === "tag" || node.type === "script") && node.children.length > 0) {
        const nestedScript = visit(node.children);
        if (nestedScript !== undefined) {
          return nestedScript;
        }
      }
    }

    return undefined;
  };

  return visit(document.children);
}

function normalizeRipplingUrl(value: unknown, source: RipplingJobSource) {
  const externalUrl = getNonEmptyString(value);
  if (!externalUrl) {
    return { url: source.canonicalUrl, warning: undefined };
  }

  try {
    const parsedUrl = new URL(externalUrl);
    const expectedPath = `/${source.companySlug}/jobs/${source.jobId}`;

    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.hostname.toLocaleLowerCase() !== "ats.rippling.com" ||
      parsedUrl.pathname !== expectedPath ||
      parsedUrl.username ||
      parsedUrl.password
    ) {
      throw new Error("Unexpected Rippling job URL");
    }

    parsedUrl.search = new URL(source.canonicalUrl).search;
    parsedUrl.hash = "";
    return { url: parsedUrl.toString(), warning: undefined };
  } catch {
    return {
      url: source.canonicalUrl,
      warning: {
        code: "INVALID_EXTERNAL_URL",
        message: "Rippling returned an unexpected job URL; the submitted URL will be used instead.",
      } satisfies JobImportWarning,
    };
  }
}

function normalizeDescription(value: z.infer<typeof ripplingJobPostSchema>["description"]) {
  const sections = [value?.company, value?.role]
    .map(getNonEmptyString)
    .map((section) => (section ? normalizeImportedHtmlToPlainText(section) : undefined))
    .filter((section): section is string => Boolean(section));

  return sections.length > 0 ? sections.join("\n\n") : undefined;
}

function normalizeWorkLocations(value: unknown) {
  const locations = (Array.isArray(value) ? value : [value])
    .map(getNonEmptyString)
    .filter((location): location is string => Boolean(location));

  return locations.length > 0 ? [...new Set(locations)].join(" / ") : undefined;
}

function normalizeRipplingSalary(value: unknown) {
  if (!Array.isArray(value) || value.length !== 1) {
    return {};
  }

  const parsedRange = ripplingAnnualPayRangeSchema.safeParse(value[0]);
  if (!parsedRange.success) {
    return {};
  }

  const frequency = parsedRange.data.frequency
    .toLocaleLowerCase()
    .replace(/[_-]+/g, " ")
    .trim();
  const currency = getNonEmptyString(parsedRange.data.currency)?.toLocaleUpperCase();

  if (
    !currency ||
    !["annual", "annually", "per year", "year", "yearly"].includes(frequency) ||
    parsedRange.data.rangeStart > parsedRange.data.rangeEnd
  ) {
    return {};
  }

  return {
    salaryCurrency: currency,
    salaryMax: parsedRange.data.rangeEnd,
    salaryMin: parsedRange.data.rangeStart,
  };
}

function toJobImportSeed(
  source: RipplingJobSource,
  jobPost: z.infer<typeof ripplingJobPostSchema>,
) {
  const warnings: JobImportWarning[] = [];
  const title = getNonEmptyString(jobPost.name);
  const authoritativeCompany = getNonEmptyString(jobPost.companyName);
  const company = authoritativeCompany ?? getSuggestedCompanyFromIdentifier(source.companySlug);
  const description = normalizeDescription(jobPost.description);
  const location = normalizeWorkLocations(jobPost.workLocations);
  const employmentType =
    normalizeImportedEmploymentType(getNonEmptyString(jobPost.employmentType?.id)) ??
    normalizeImportedEmploymentType(getNonEmptyString(jobPost.employmentType?.label));
  const remoteType = inferImportedRemoteType({ description, location });
  const normalizedUrl = normalizeRipplingUrl(jobPost.url, source);

  if (normalizedUrl.warning) {
    warnings.push(normalizedUrl.warning);
  }
  if (!authoritativeCompany) {
    warnings.push(getInferredCompanyWarning("Rippling", "company slug"));
  }

  const seed: JobImportSeed = {
    company,
    source: "Rippling",
    title,
    url: normalizedUrl.url,
    ...(description ? { description } : {}),
    ...(employmentType ? { employmentType } : {}),
    ...(location ? { location } : {}),
    ...(remoteType ? { remoteType } : {}),
    ...normalizeRipplingSalary(jobPost.payRangeDetails),
  };

  return { seed, warnings };
}

export function importRipplingJobFromHtml(
  source: RipplingJobSource,
  html: string,
): JobImportResult {
  const nextDataScript = getNextDataScript(html);
  if (!nextDataScript) {
    return {
      error: {
        code: "MALFORMED_EXTERNAL_DATA",
        message: "Rippling did not include the expected job data.",
      },
      success: false,
    };
  }

  let rawNextData: unknown;
  try {
    rawNextData = JSON.parse(nextDataScript);
  } catch {
    return {
      error: {
        code: "MALFORMED_EXTERNAL_DATA",
        message: "Rippling returned malformed job data.",
      },
      success: false,
    };
  }

  const parsedNextData = ripplingNextDataSchema.safeParse(rawNextData);
  if (!parsedNextData.success || !getNonEmptyString(parsedNextData.data.props.pageProps.apiData.jobPost.name)) {
    return {
      error: {
        code: "MALFORMED_EXTERNAL_DATA",
        message: "Rippling returned job data in an unexpected format.",
      },
      success: false,
    };
  }

  const { seed, warnings } = toJobImportSeed(source, parsedNextData.data.props.pageProps.apiData.jobPost);
  const parsedSeed = jobImportSeedSchema.safeParse(seed);
  if (!parsedSeed.success) {
    return {
      error: {
        code: "INVALID_DRAFT",
        message: "Rippling did not provide usable job details.",
      },
      success: false,
    };
  }

  return { seed: parsedSeed.data, source, success: true, warnings };
}

export async function importRipplingJob(
  source: RipplingJobSource,
  fetchHtml: RipplingHtmlFetcher = fetchSafePublicHtml,
): Promise<JobImportResult> {
  try {
    const { html } = await fetchHtml(new URL(source.canonicalUrl));
    return importRipplingJobFromHtml(source, html);
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
        message: "The Rippling job could not be retrieved.",
      },
      success: false,
    };
  }
}
