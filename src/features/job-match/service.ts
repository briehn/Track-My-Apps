import "server-only";

import type { EmploymentType, ExperienceRange, RemoteType } from "@prisma/client";
import OpenAI, {
  APIError,
  APIConnectionError,
  APIConnectionTimeoutError,
  InternalServerError,
  RateLimitError,
} from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import {
  aiJobMatchResponseSchema,
  normalizeJobMatchReport,
  normalizeResumeTextForJobMatch,
  type JobMatchReport,
} from "@/features/job-match/schemas";

type JobMatchErrorCode =
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

type JobMatchServiceInput = {
  job: {
    company: string;
    employmentType: EmploymentType | null;
    remoteType: RemoteType | null;
    title: string;
  };
  analysis: {
    keywords: string[];
    preferredSkills: string[];
    requiredSkills: string[];
    responsibilities: string[];
    seniorityLevel: string | null;
    summary: string | null;
  };
  profile: {
    experienceSummary: string | null;
    resumeText: string | null;
    skills: string[];
    targetTitle: string | null;
    workPreferences: RemoteType[];
    yearsOfExperience: ExperienceRange | null;
  };
};

export class JobMatchServiceError extends Error {
  constructor(
    public code: JobMatchErrorCode,
    message: string,
    public details?: ProviderErrorDetails,
  ) {
    super(message);
  }
}

function requiredEnv(name: "OPENAI_API_KEY" | "OPENAI_MODEL") {
  const value = process.env[name];

  if (!value) {
    throw new JobMatchServiceError(
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
  console.error("Job match OpenAI request failed", {
    category,
    status: details.status,
    code: details.code,
    name: details.name,
    message: details.message,
    requestId: details.requestId,
  });
}

export async function analyzeProfileJobMatchWithOpenAI(
  input: JobMatchServiceInput,
): Promise<JobMatchReport> {
  const openai = new OpenAI({
    apiKey: requiredEnv("OPENAI_API_KEY"),
  });
  const model = requiredEnv("OPENAI_MODEL");
  const normalizedResumeText = normalizeResumeTextForJobMatch(input.profile.resumeText);
  const promptPayload = {
    job: {
      title: input.job.title,
      company: input.job.company,
      remoteType: input.job.remoteType,
      employmentType: input.job.employmentType,
      analysis: input.analysis,
    },
    profile: {
      targetTitle: input.profile.targetTitle,
      yearsOfExperience: input.profile.yearsOfExperience,
      skills: input.profile.skills,
      experienceSummary: input.profile.experienceSummary,
      resumeText: normalizedResumeText,
      workPreferences: input.profile.workPreferences,
    },
  };

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
                "You compare a saved user profile against a saved job analysis.",
                "This is for general job seekers, not only software roles.",
                "Base the report only on the provided saved profile fields and saved job analysis.",
                "Do not fabricate skills, years of experience, certifications, projects, employment history, or achievements.",
                "Treat missing evidence as missing evidence.",
                "Do not say the user is guaranteed to be qualified or hired.",
                "overallFitSummary must explicitly frame the result as based on the saved profile and this job's analysis.",
                "fitLevel must be one of LOW, MODERATE, or STRONG.",
                "matchingSkills should include only clear overlaps.",
                "missingOrWeakSkills should include only requirements or themes that are missing or weakly supported.",
                "relevantProfileEvidence must come only from explicit profile fields or pasted resume text included in the input.",
                "resumeImprovementSuggestions must use safe language such as highlight existing experience with X if applicable, clarify X if true, or quantify impact if you have real metrics.",
                "Never tell the user to claim experience they do not have.",
                "interviewPrepFocusAreas should focus on responsibilities, requirements, and weaker areas worth preparing for.",
                "warnings should call out incomplete profile data, missing evidence, or shallow job-analysis data when relevant.",
                "Keep the report concise and practical.",
                "Each array should contain at most 8 short items.",
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
                "Compare the saved profile against the saved job analysis below.",
                "Return structured output only.",
                "MATCH_INPUT_START",
                JSON.stringify(promptPayload, null, 2),
                "MATCH_INPUT_END",
              ].join("\n"),
            },
          ],
        },
      ],
      text: {
        format: zodTextFormat(aiJobMatchResponseSchema, "job_match"),
      },
    });

    if (!response.output_parsed) {
      throw new JobMatchServiceError(
        "MALFORMED_OUTPUT",
        "OpenAI did not return parsed job match output.",
      );
    }

    return normalizeJobMatchReport(response.output_parsed);
  } catch (error) {
    if (error instanceof JobMatchServiceError) {
      throw error;
    }

    if (error instanceof APIConnectionTimeoutError) {
      const details = getProviderErrorDetails(error);
      logProviderFailure("TIMEOUT", details);
      throw new JobMatchServiceError("TIMEOUT", "OpenAI request timed out.", details);
    }

    if (error instanceof RateLimitError) {
      const details = getProviderErrorDetails(error);

      if (details.code === "insufficient_quota") {
        logProviderFailure("UNAVAILABLE", details);
        throw new JobMatchServiceError(
          "QUOTA_EXCEEDED",
          "OpenAI quota exceeded.",
          details,
        );
      }

      logProviderFailure("RATE_LIMITED", details);
      throw new JobMatchServiceError(
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
      throw new JobMatchServiceError(
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
          throw new JobMatchServiceError(
            "QUOTA_EXCEEDED",
            "OpenAI quota exceeded.",
            details,
          );
        }

        logProviderFailure("RATE_LIMITED", details);
        throw new JobMatchServiceError(
          "RATE_LIMITED",
          "OpenAI rate limit reached.",
          details,
        );
      }

      if (details.status !== null && details.status >= 500) {
        logProviderFailure("UNAVAILABLE", details);
        throw new JobMatchServiceError(
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
      throw new JobMatchServiceError("TIMEOUT", "OpenAI request timed out.", details);
    }

    if (details.status === 429) {
      logProviderFailure("RATE_LIMITED", details);
      throw new JobMatchServiceError(
        "RATE_LIMITED",
        "OpenAI rate limit reached.",
        details,
      );
    }

    if (details.status !== null && details.status >= 500) {
      logProviderFailure("UNAVAILABLE", details);
      throw new JobMatchServiceError(
        "UNAVAILABLE",
        "OpenAI provider temporarily unavailable.",
        details,
      );
    }

    logProviderFailure("PROVIDER_FAILURE", details);
    throw new JobMatchServiceError(
      "PROVIDER_FAILURE",
      "OpenAI job match request failed.",
      details,
    );
  }
}
