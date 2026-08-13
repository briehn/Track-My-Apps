import { parseDocument } from "htmlparser2";
import { z } from "zod";

import { jobDraftSchema, type JobDraft } from "@/features/jobs/schemas";
import type { GreenhouseJobSource } from "@/features/jobs/importers/job-url";
import type { JobImportResult, JobImportWarning } from "@/features/jobs/importers/types";

const GREENHOUSE_API_ORIGIN = "https://boards-api.greenhouse.io";
const GREENHOUSE_REQUEST_TIMEOUT_MS = 10_000;
const GREENHOUSE_MAX_RESPONSE_BYTES = 1_000_000;

const BLOCK_TAGS = new Set([
  "article",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "pre",
  "section",
]);
const IGNORED_TAGS = new Set(["script", "style", "noscript"]);

type GreenhouseHtmlNode = ReturnType<typeof parseDocument>["children"][number];

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

function hasEncodedHtmlTag(value: string) {
  return /&(?:amp;)?lt;\s*\/?\s*[a-z][a-z0-9:-]*(?:\s|&(?:amp;)?gt;)/i.test(value);
}

function decodeEncodedMarkupLayer(value: string) {
  const entities: Record<string, string> = {
    "#39": "'",
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    quot: '"',
  };

  return value.replace(/&(amp|lt|gt|quot|apos|#39);/gi, (entity) => {
    return entities[entity.slice(1, -1).toLocaleLowerCase()] ?? entity;
  });
}

function unwrapEncodedGreenhouseMarkup(value: string) {
  let normalizedValue = value;

  // Greenhouse sometimes entity-encodes the entire HTML document. Unwrap only
  // enough layers to expose markup to the parser, never repeatedly decode text.
  for (let depth = 0; depth < 2 && hasEncodedHtmlTag(normalizedValue); depth += 1) {
    normalizedValue = decodeEncodedMarkupLayer(normalizedValue);
  }

  return normalizedValue;
}

function normalizePlainText(value: string) {
  const lines = value.replace(/\u00a0/g, " ").replace(/\r\n?/g, "\n").split("\n");
  const normalizedLines = lines.map((line) => {
    const leadingWhitespace = /^\s*/.exec(line)?.[0] ?? "";
    const normalizedContent = line.slice(leadingWhitespace.length).replace(/\s+/g, " ").trim();

    if (!normalizedContent) {
      return "";
    }

    return `${leadingWhitespace ? "  " : ""}${normalizedContent}`;
  });

  return normalizedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function normalizeGreenhouseDescription(content: string) {
  const document = parseDocument(unwrapEncodedGreenhouseMarkup(content), {
    decodeEntities: true,
  });
  let output = "";

  const appendText = (value: string) => {
    output += value;
  };
  const appendBreak = (count = 1) => {
    if (!output.endsWith("\n".repeat(count))) {
      output = output.replace(/\n+$/, "") + "\n".repeat(count);
    }
  };

  const visit = (nodes: GreenhouseHtmlNode[], listDepth = 0): void => {
    for (const node of nodes) {
      if (node.type === "text") {
        appendText(node.data);
        continue;
      }

      if (node.type !== "tag") {
        continue;
      }

      const tagName = node.name.toLocaleLowerCase();

      if (IGNORED_TAGS.has(tagName)) {
        continue;
      }

      if (tagName === "br") {
        appendBreak();
        continue;
      }

      if (tagName === "ul" || tagName === "ol") {
        const listBreakCount = listDepth > 0 ? 1 : 2;
        appendBreak(listBreakCount);
        visit(node.children, listDepth + 1);
        appendBreak(listBreakCount);
        continue;
      }

      if (tagName === "li") {
        appendBreak();
        appendText(`${"  ".repeat(Math.max(0, listDepth - 1))}- `);
        visit(node.children, listDepth);
        appendBreak();
        continue;
      }

      if (BLOCK_TAGS.has(tagName)) {
        appendBreak(2);
        visit(node.children, listDepth);
        appendBreak(2);
        continue;
      }

      visit(node.children, listDepth);
    }
  };

  visit(document.children);
  return normalizePlainText(output);
}

export function inferGreenhouseRemoteType(
  location: string | null | undefined,
  description?: string | null,
) {
  const normalizedLocation = location?.toLocaleLowerCase() ?? "";

  if (/\bremote\b/.test(normalizedLocation)) {
    return "REMOTE" as const;
  }

  if (/\bhybrid\b/.test(normalizedLocation)) {
    return "HYBRID" as const;
  }

  const normalizedDescription = description?.toLocaleLowerCase() ?? "";
  const hasExplicitHybridRoleStatement =
    /\b(?:this|the)\s+(?:role|position|job)\s+(?:is|will be|requires?)\b[^.\n]{0,120}\bhybrid\b/.test(
      normalizedDescription,
    ) ||
    /\b(?:this|the)\s+(?:role|position|job)\s+requires?\b[^.\n]{0,120}\b(?:day|days|week)\b[^.\n]{0,120}\b(?:in[- ]office|office)\b/.test(
      normalizedDescription,
    );

  return hasExplicitHybridRoleStatement ? "HYBRID" : undefined;
}

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
  const remoteType = inferGreenhouseRemoteType(response.location?.name, response.content);

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
    ...(response.content ? { description: normalizeGreenhouseDescription(response.content) } : {}),
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
      draft: parsedDraft.data,
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
