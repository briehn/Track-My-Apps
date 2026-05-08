import "server-only";

import OpenAI, {
  APIError,
  APIConnectionError,
  APIConnectionTimeoutError,
  InternalServerError,
  RateLimitError,
} from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import {
  aiProfileExtractionResponseSchema,
  normalizeProfileExtractionSuggestion,
  type ProfileExtractionSuggestion,
} from "@/features/profiles/schemas";

type ProfileExtractionErrorCode =
  | "NOT_CONFIGURED"
  | "PROVIDER_FAILURE"
  | "MALFORMED_OUTPUT"
  | "RATE_LIMITED"
  | "UNAVAILABLE"
  | "QUOTA_EXCEEDED"
  | "TIMEOUT";

type ProviderErrorDetails = {
  status: number | null;
  code: string | null;
  name: string | null;
  message: string | null;
  requestId: string | null;
};

export class ProfileExtractionServiceError extends Error {
  constructor(
    public code: ProfileExtractionErrorCode,
    message: string,
    public details?: ProviderErrorDetails,
  ) {
    super(message);
  }
}

function requiredEnv(name: "OPENAI_API_KEY" | "OPENAI_MODEL") {
  const value = process.env[name];

  if (!value) {
    throw new ProfileExtractionServiceError(
      "NOT_CONFIGURED",
      `Missing required environment variable: ${name}`,
    );
  }

  return value;
}

function getProviderErrorDetails(error: unknown): ProviderErrorDetails {
  if (!error || typeof error !== "object") {
    return {
      status: null,
      code: null,
      name: null,
      message: null,
      requestId: null,
    };
  }

  return {
    status:
      "status" in error && typeof error.status === "number" ? error.status : null,
    code: "code" in error && typeof error.code === "string" ? error.code : null,
    name: "name" in error && typeof error.name === "string" ? error.name : null,
    message:
      "message" in error && typeof error.message === "string"
        ? error.message
        : null,
    requestId:
      "requestID" in error && typeof error.requestID === "string"
        ? error.requestID
        : null,
  };
}

function logProviderFailure(
  category: "TIMEOUT" | "RATE_LIMITED" | "UNAVAILABLE" | "PROVIDER_FAILURE",
  details: ProviderErrorDetails,
) {
  console.error("Profile extraction OpenAI request failed", {
    category,
    status: details.status,
    code: details.code,
    name: details.name,
    message: details.message,
    requestId: details.requestId,
  });
}

export async function extractProfileSuggestionsFromResumeText(
  resumeText: string,
): Promise<ProfileExtractionSuggestion> {
  const openai = new OpenAI({
    apiKey: requiredEnv("OPENAI_API_KEY"),
  });
  const model = requiredEnv("OPENAI_MODEL");
  const normalizedResumeText = resumeText
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  try {
    const response = await openai.responses.parse({
      model,
      max_output_tokens: 1200,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "You extract structured profile suggestions from a pasted resume.",
                "This is for a general job seeker profile, not just software roles.",
                "Use only information directly stated or clearly implied by the resume text.",
                "Do not invent titles, links, industries, certifications, work preferences, or seniority.",
                "targetTitle should be the clearest current or target professional title from the resume.",
                "yearsOfExperience should be null unless the range is clearly inferable from explicit dates or stated experience.",
                "skills should include concrete tools, domains, functions, platforms, or role skills, not generic soft skills.",
                "experienceSummary should be factual, concise, and under 450 characters.",
                "portfolioUrl, githubUrl, and linkedinUrl should only be included if explicitly present.",
                "workPreferences should be an empty array unless remote, hybrid, or onsite preference is clearly stated or strongly indicated.",
                "If the resume does not support a field confidently, return null or an empty array for that field.",
                "Return no more than 20 skills.",
              ].join(" "),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                "Extract structured profile suggestions from the resume text below.",
                "These suggestions will be reviewed by the user before being applied.",
                "RESUME_TEXT_START",
                normalizedResumeText,
                "RESUME_TEXT_END",
              ].join("\n"),
            },
          ],
        },
      ],
      text: {
        format: zodTextFormat(aiProfileExtractionResponseSchema, "profile_extraction"),
      },
    });

    if (!response.output_parsed) {
      throw new ProfileExtractionServiceError(
        "MALFORMED_OUTPUT",
        "OpenAI did not return parsed profile extraction output.",
      );
    }

    return normalizeProfileExtractionSuggestion(response.output_parsed);
  } catch (error) {
    if (error instanceof ProfileExtractionServiceError) {
      throw error;
    }

    if (error instanceof APIConnectionTimeoutError) {
      const details = getProviderErrorDetails(error);
      logProviderFailure("TIMEOUT", details);
      throw new ProfileExtractionServiceError(
        "TIMEOUT",
        "OpenAI request timed out.",
        details,
      );
    }

    if (error instanceof RateLimitError) {
      const details = getProviderErrorDetails(error);

      if (details.code === "insufficient_quota") {
        logProviderFailure("UNAVAILABLE", details);
        throw new ProfileExtractionServiceError(
          "QUOTA_EXCEEDED",
          "OpenAI quota exceeded.",
          details,
        );
      }

      logProviderFailure("RATE_LIMITED", details);
      throw new ProfileExtractionServiceError(
        "RATE_LIMITED",
        "OpenAI rate limit reached.",
        details,
      );
    }

    if (
      error instanceof InternalServerError ||
      error instanceof APIConnectionError
    ) {
      const details = getProviderErrorDetails(error);
      logProviderFailure("UNAVAILABLE", details);
      throw new ProfileExtractionServiceError(
        "UNAVAILABLE",
        "OpenAI provider temporarily unavailable.",
        details,
      );
    }

    const details = getProviderErrorDetails(error);

    if (error instanceof APIError) {
      if (details.status === 429) {
        if (details.code === "insufficient_quota") {
          logProviderFailure("UNAVAILABLE", details);
          throw new ProfileExtractionServiceError(
            "QUOTA_EXCEEDED",
            "OpenAI quota exceeded.",
            details,
          );
        }

        logProviderFailure("RATE_LIMITED", details);
        throw new ProfileExtractionServiceError(
          "RATE_LIMITED",
          "OpenAI rate limit reached.",
          details,
        );
      }

      if (details.status !== null && details.status >= 500) {
        logProviderFailure("UNAVAILABLE", details);
        throw new ProfileExtractionServiceError(
          "UNAVAILABLE",
          "OpenAI provider temporarily unavailable.",
          details,
        );
      }
    }

    const isTimeout =
      details.status === 408 ||
      details.code === "ETIMEDOUT" ||
      details.code === "ECONNABORTED" ||
      (details.name !== null && details.name.toLowerCase().includes("timeout")) ||
      (details.message !== null &&
        details.message.toLowerCase().includes("timed out"));

    if (isTimeout) {
      logProviderFailure("TIMEOUT", details);
      throw new ProfileExtractionServiceError(
        "TIMEOUT",
        "OpenAI request timed out.",
        details,
      );
    }

    if (details.status === 429) {
      logProviderFailure("RATE_LIMITED", details);
      throw new ProfileExtractionServiceError(
        "RATE_LIMITED",
        "OpenAI rate limit reached.",
        details,
      );
    }

    if (details.status !== null && details.status >= 500) {
      logProviderFailure("UNAVAILABLE", details);
      throw new ProfileExtractionServiceError(
        "UNAVAILABLE",
        "OpenAI provider temporarily unavailable.",
        details,
      );
    }

    logProviderFailure("PROVIDER_FAILURE", details);
    throw new ProfileExtractionServiceError(
      "PROVIDER_FAILURE",
      "OpenAI profile extraction request failed.",
      details,
    );
  }
}
