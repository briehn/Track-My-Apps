import { z } from "zod";

import { normalizeImportedHtmlToPlainText } from "@/features/jobs/importers/html-to-plain-text";
import { inferImportedRemoteType } from "@/features/jobs/importers/work-mode";
import { jobDraftSchema, type JobDraft } from "@/features/jobs/schemas";
import type { GreenhouseJobSource } from "@/features/jobs/importers/job-url";
import type { JobImportResult, JobImportWarning } from "@/features/jobs/importers/types";

const GREENHOUSE_API_ORIGIN = "https://boards-api.greenhouse.io";
const GREENHOUSE_REQUEST_TIMEOUT_MS = 10_000;
const GREENHOUSE_MAX_RESPONSE_BYTES = 1_000_000;

const greenhouseJobResponseSchema = z.object({
  absolute_url: z.string().optional(),
  application_deadline: z.string().nullable().optional(),
  company_name: z.string(),
  content: z.string().nullable().optional(),
  location: z
    .object({
      name: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  title: z.string(),
});

export type GreenhouseJsonFetcher = (url: URL) => Promise<unknown>;

function getGreenhouseApiUrl(source: GreenhouseJobSource) {
  const apiUrl = new URL(
    `/v1/boards/${encodeURIComponent(source.boardToken)}/jobs/${encodeURIComponent(source.jobId)}`,
    GREENHOUSE_API_ORIGIN,
  );

  if (apiUrl.origin !== GREENHOUSE_API_ORIGIN) {
    throw new Error("Greenhouse API URL must use the configured API origin.");
  }

  return apiUrl;
}

async function fetchGreenhouseJson(url: URL): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    redirect: "error",
    signal: AbortSignal.timeout(GREENHOUSE_REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Greenhouse returned ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLocaleLowerCase().includes("application/json")) {
    throw new Error("Greenhouse returned an unexpected response type.");
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength && Number(contentLength) > GREENHOUSE_MAX_RESPONSE_BYTES) {
    throw new Error("Greenhouse returned a response that is too large.");
  }

  const responseBytes = new Uint8Array(await response.arrayBuffer());
  if (responseBytes.byteLength > GREENHOUSE_MAX_RESPONSE_BYTES) {
    throw new Error("Greenhouse returned a response that is too large.");
  }

  try {
    return JSON.parse(new TextDecoder().decode(responseBytes));
  } catch {
    throw new Error("Greenhouse returned malformed JSON.");
  }
}

function normalizeGreenhouseUrl(value: string | undefined, fallback: string) {
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
        message: "Greenhouse returned an invalid job URL; the submitted URL will be used instead.",
      } satisfies JobImportWarning,
    };
  }
}

function normalizeDeadline(value: string | null | undefined) {
  if (!value) {
    return { deadline: undefined, warning: undefined };
  }

  const deadline = new Date(value);
  if (Number.isNaN(deadline.getTime())) {
    return {
      deadline: undefined,
      warning: {
        code: "INVALID_APPLICATION_DEADLINE",
        message: "Greenhouse returned an invalid application deadline; it was omitted.",
      } satisfies JobImportWarning,
    };
  }

  return { deadline, warning: undefined };
}

function toJobDraft(
  source: GreenhouseJobSource,
  response: z.infer<typeof greenhouseJobResponseSchema>,
) {
  const warnings: JobImportWarning[] = [];
  const normalizedUrl = normalizeGreenhouseUrl(response.absolute_url, source.canonicalUrl);
  const normalizedDeadline = normalizeDeadline(response.application_deadline);
  const remoteType = inferImportedRemoteType({
    description: response.content,
    location: response.location?.name,
  });

  if (normalizedUrl.warning) {
    warnings.push(normalizedUrl.warning);
  }

  if (normalizedDeadline.warning) {
    warnings.push(normalizedDeadline.warning);
  }

  const draft: JobDraft = {
    company: response.company_name,
    title: response.title,
    source: "Greenhouse",
    url: normalizedUrl.url,
    ...(response.location?.name ? { location: response.location.name } : {}),
    ...(response.content ? { description: normalizeImportedHtmlToPlainText(response.content) } : {}),
    ...(remoteType ? { remoteType } : {}),
    ...(normalizedDeadline.deadline ? { deadline: normalizedDeadline.deadline } : {}),
  };

  return { draft, warnings };
}

export async function importGreenhouseJob(
  source: GreenhouseJobSource,
  fetchJson: GreenhouseJsonFetcher = fetchGreenhouseJson,
): Promise<JobImportResult> {
  try {
    const rawResponse = await fetchJson(getGreenhouseApiUrl(source));
    const parsedResponse = greenhouseJobResponseSchema.safeParse(rawResponse);

    if (!parsedResponse.success) {
      return {
        error: {
          code: "MALFORMED_EXTERNAL_DATA",
          message: "Greenhouse returned job data in an unexpected format.",
        },
        success: false,
      };
    }

    const { draft, warnings } = toJobDraft(source, parsedResponse.data);
    const parsedDraft = jobDraftSchema.safeParse(draft);

    if (!parsedDraft.success) {
      return {
        error: {
          code: "INVALID_DRAFT",
          message: "Greenhouse did not provide the required job details.",
        },
        success: false,
      };
    }

    return {
      seed: parsedDraft.data,
      source,
      success: true,
      warnings,
    };
  } catch {
    return {
      error: {
        code: "EXTRACTION_FAILED",
        message: "The Greenhouse job could not be retrieved.",
      },
      success: false,
    };
  }
}
