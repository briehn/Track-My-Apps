"use server";

import type { EmploymentType, ExperienceRange, RemoteType } from "@prisma/client";

import { requireUser } from "@/features/auth/require-user";
import {
  AiUsageFeature,
  completeAiUsageReservation,
  releaseAiUsageReservation,
  reserveAiUsage,
} from "@/features/ai-usage/quota";
import {
  analyzeProfileJobMatchWithOpenAI,
  JobMatchServiceError,
} from "@/features/job-match/service";
import {
  analyzeJobMatchSchema,
  mergeJobMatchWarnings,
  type JobMatchReport,
} from "@/features/job-match/schemas";
import { prisma } from "@/server/db/prisma";

export type AnalyzeJobMatchActionState = {
  canRetry?: boolean;
  formError?: string;
  report?: JobMatchReport;
};

type ProfileForJobMatch = {
  experienceSummary: string | null;
  resumeText: string | null;
  skills: string[];
  targetTitle: string | null;
  workPreferences: RemoteType[];
  yearsOfExperience: ExperienceRange | null;
};

type JobForJobMatch = {
  analysis: {
    keywords: string[];
    preferredSkills: string[];
    requiredSkills: string[];
    responsibilities: string[];
    seniorityLevel: string | null;
    summary: string | null;
  };
  company: string;
  employmentType: EmploymentType | null;
  id: string;
  remoteType: RemoteType | null;
  title: string;
};

type PersistenceErrorDiagnostics = {
  code: string | null;
  message: string | null;
  name: string | null;
};

function normalizeNullableText(value: string | null) {
  const trimmedValue = value?.trim() ?? "";
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function normalizeStringList(values: string[]) {
  const seen = new Set<string>();
  const normalizedValues: string[] = [];

  for (const value of values) {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      continue;
    }

    const dedupeKey = trimmedValue.toLocaleLowerCase();

    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    normalizedValues.push(trimmedValue);
  }

  return normalizedValues;
}

function getPersistenceErrorDiagnostics(error: unknown): PersistenceErrorDiagnostics {
  if (!error || typeof error !== "object") {
    return {
      code: null,
      message: null,
      name: null,
    };
  }

  return {
    code: "code" in error && typeof error.code === "string" ? error.code : null,
    message:
      "message" in error && typeof error.message === "string"
        ? error.message
        : null,
    name: "name" in error && typeof error.name === "string" ? error.name : null,
  };
}

function getDeterministicWarnings(
  profile: ProfileForJobMatch,
  job: JobForJobMatch,
): string[] {
  const warnings: string[] = [];

  if (!normalizeNullableText(profile.resumeText)) {
    warnings.push(
      "Your saved profile does not include resume text, so this report may be less complete.",
    );
  }

  if (profile.skills.length === 0) {
    warnings.push(
      "Your saved profile does not list skills yet, which weakens direct skill matching.",
    );
  }

  if (
    !profile.targetTitle &&
    !profile.yearsOfExperience &&
    !profile.experienceSummary &&
    profile.skills.length === 0
  ) {
    warnings.push(
      "Your saved profile has limited structured detail, so this comparison is based on partial evidence.",
    );
  }

  if (
    job.analysis &&
    job.analysis.requiredSkills.length === 0 &&
    job.analysis.preferredSkills.length === 0 &&
    job.analysis.responsibilities.length === 0 &&
    job.analysis.keywords.length === 0
  ) {
    warnings.push(
      "This job's saved analysis has limited detail, so the comparison may be less specific.",
    );
  }

  return warnings;
}

export async function analyzeJobMatch(
  _previousState: AnalyzeJobMatchActionState,
  formData: FormData,
): Promise<AnalyzeJobMatchActionState> {
  const user = await requireUser();
  const parsedInput = analyzeJobMatchSchema.safeParse({
    jobId: formData.get("jobId"),
  });

  if (!parsedInput.success) {
    return {
      canRetry: false,
      formError: "This job could not be matched.",
    };
  }

  const [job, profile] = await Promise.all([
    prisma.job.findFirst({
      where: {
        id: parsedInput.data.jobId,
        userId: user.id,
      },
      select: {
        id: true,
        company: true,
        title: true,
        remoteType: true,
        employmentType: true,
        analysis: {
          select: {
            summary: true,
            requiredSkills: true,
            preferredSkills: true,
            responsibilities: true,
            keywords: true,
            seniorityLevel: true,
          },
        },
      },
    }),
    prisma.userProfile.findUnique({
      where: {
        userId: user.id,
      },
      select: {
        targetTitle: true,
        yearsOfExperience: true,
        skills: true,
        experienceSummary: true,
        resumeText: true,
        workPreferences: true,
      },
    }),
  ]);

  if (!job) {
    return {
      canRetry: false,
      formError: "This job could not be found.",
    };
  }

  if (!job.analysis) {
    return {
      canRetry: false,
      formError: "Analyze this job description first.",
    };
  }

  if (!profile) {
    return {
      canRetry: false,
      formError: "Complete your profile first.",
    };
  }

  const reservation = await reserveAiUsage(user.id, AiUsageFeature.JOB_MATCH);
  if (reservation.status === "rejected") {
    return {
      canRetry: false,
      formError:
        reservation.reason === "CONCURRENCY_LIMIT"
          ? "Another AI request is already processing. Try again shortly."
          : "You have reached today's profile comparison limit. Try again tomorrow.",
    };
  }

  const normalizedProfile: ProfileForJobMatch = {
    targetTitle: normalizeNullableText(profile.targetTitle),
    yearsOfExperience: profile.yearsOfExperience,
    skills: normalizeStringList(profile.skills),
    experienceSummary: normalizeNullableText(profile.experienceSummary),
    resumeText: normalizeNullableText(profile.resumeText),
    workPreferences: profile.workPreferences,
  };

  const normalizedJob: JobForJobMatch = {
    id: job.id,
    company: job.company.trim(),
    title: job.title.trim(),
    remoteType: job.remoteType,
    employmentType: job.employmentType,
    analysis: {
      summary: normalizeNullableText(job.analysis.summary),
      requiredSkills: normalizeStringList(job.analysis.requiredSkills),
      preferredSkills: normalizeStringList(job.analysis.preferredSkills),
      responsibilities: normalizeStringList(job.analysis.responsibilities),
      keywords: normalizeStringList(job.analysis.keywords),
      seniorityLevel: normalizeNullableText(job.analysis.seniorityLevel),
    },
  };

  const deterministicWarnings = getDeterministicWarnings(
    normalizedProfile,
    normalizedJob,
  );

  try {
    const report = await analyzeProfileJobMatchWithOpenAI({
      profile: normalizedProfile,
      job: {
        company: normalizedJob.company,
        title: normalizedJob.title,
        remoteType: normalizedJob.remoteType,
        employmentType: normalizedJob.employmentType,
      },
      analysis: normalizedJob.analysis,
    });

    try {
      await completeAiUsageReservation(reservation.reservationId);
    } catch {
      console.error("Job match usage completion failed", {
        jobId: normalizedJob.id,
        userId: user.id,
      });
      return {
        canRetry: true,
        formError: "The AI comparison completed, but finalizing it failed. Please try again shortly.",
      };
    }

    if (process.env.NODE_ENV === "production") {
      try {
        await prisma.jobMatchRun.create({
          data: {
            jobId: normalizedJob.id,
            userId: user.id,
          },
        });
      } catch (error) {
        const persistenceErrorDiagnostics = getPersistenceErrorDiagnostics(error);

        console.error("Job match usage tracking save failed", {
          jobId: normalizedJob.id,
          userId: user.id,
          code: persistenceErrorDiagnostics.code,
          name: persistenceErrorDiagnostics.name,
          message: persistenceErrorDiagnostics.message,
        });

        return {
          canRetry: true,
          formError:
            "The comparison completed, but saving usage tracking failed. Please try again in a moment.",
        };
      }
    }

    return {
      canRetry: true,
      report: mergeJobMatchWarnings(report, deterministicWarnings),
    };
  } catch (error) {
    await releaseAiUsageReservation(reservation.reservationId);
    if (error instanceof JobMatchServiceError) {
      console.error("Job match action failed", {
        code: error.code,
        jobId: normalizedJob.id,
        userId: user.id,
        status: error.details?.status ?? null,
        providerCode: error.details?.code ?? null,
        providerName: error.details?.name ?? null,
        providerRequestId: error.details?.requestId ?? null,
      });

      switch (error.code) {
        case "NOT_CONFIGURED":
          return {
            canRetry: false,
            formError: "AI job matching is not configured right now.",
          };
        case "MALFORMED_OUTPUT":
          return {
            canRetry: true,
            formError: "The AI match report could not be validated. Try again.",
          };
        case "TIMEOUT":
          return {
            canRetry: true,
            formError: "The AI match analysis took too long. Please try again.",
          };
        case "RATE_LIMITED":
          return {
            canRetry: true,
            formError: "OpenAI is rate-limiting requests right now. Please try again in a few minutes.",
          };
        case "QUOTA_EXCEEDED":
          return {
            canRetry: false,
            formError: "AI job matching is temporarily unavailable due to provider quota limits. Please try again later.",
          };
        case "UNAVAILABLE":
        case "PROVIDER_FAILURE":
        default:
          return {
            canRetry: true,
            formError: "There was an issue comparing your profile to this job. Please try again later.",
          };
      }
    }

    console.error("Job match action failed with unexpected provider error", {
      jobId: normalizedJob.id,
      userId: user.id,
    });

    return {
      canRetry: true,
      formError: "There was an issue comparing your profile to this job. Please try again later.",
    };
  }
}
