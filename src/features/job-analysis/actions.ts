"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/features/auth/require-user";
import {
  analyzeJobDescriptionSchema,
  hasAnalyzableJobDescription,
  isJobDescriptionTooLong,
  PRODUCTION_DAILY_AI_ANALYSIS_LIMIT,
} from "@/features/job-analysis/schemas";
import {
  analyzeJobDescriptionWithOpenAI,
  JobAnalysisServiceError,
} from "@/features/job-analysis/service";
import { prisma } from "@/server/db/prisma";

export type AnalyzeJobDescriptionActionState = {
  formError?: string;
  canRetry?: boolean;
};

export async function analyzeJobDescription(
  _previousState: AnalyzeJobDescriptionActionState,
  formData: FormData,
): Promise<AnalyzeJobDescriptionActionState> {
  const user = await requireUser();
  const parsedInput = analyzeJobDescriptionSchema.safeParse({
    jobId: formData.get("jobId"),
  });

  if (!parsedInput.success) {
    return {
      formError: "This job could not be analyzed.",
      canRetry: false,
    };
  }

  const job = await prisma.job.findFirst({
    where: {
      id: parsedInput.data.jobId,
      userId: user.id,
    },
    select: {
      id: true,
      description: true,
    },
  });

  if (!job) {
    return {
      formError: "This job could not be found.",
      canRetry: false,
    };
  }

  if (!hasAnalyzableJobDescription(job.description)) {
    return {
      formError: "Add a fuller job description before running analysis.",
      canRetry: false,
    };
  }

  if (isJobDescriptionTooLong(job.description)) {
    return {
      formError: "This job description is too long to analyze. Shorten it to 10,000 characters or less.",
      canRetry: false,
    };
  }

  if (process.env.NODE_ENV === "production") {
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);

    const nextDayStart = new Date(dayStart);
    nextDayStart.setUTCDate(nextDayStart.getUTCDate() + 1);

    const runsToday = await prisma.jobAnalysisRun.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: dayStart,
          lt: nextDayStart,
        },
      },
    });

    if (runsToday >= PRODUCTION_DAILY_AI_ANALYSIS_LIMIT) {
      return {
        formError: "You have reached today's AI analysis limit. Please try again tomorrow.",
        canRetry: false,
      };
    }
  }

  let result: Awaited<ReturnType<typeof analyzeJobDescriptionWithOpenAI>>;

  try {
    result = await analyzeJobDescriptionWithOpenAI(job.description);
  } catch (error) {
    if (error instanceof JobAnalysisServiceError) {
      console.error("Job analysis action failed", {
        code: error.code,
        jobId: job.id,
        userId: user.id,
        status: error.details?.status ?? null,
        providerCode: error.details?.code ?? null,
        providerName: error.details?.name ?? null,
        providerRequestId: error.details?.requestId ?? null,
      });

      switch (error.code) {
        case "NOT_CONFIGURED":
          return {
            formError: "AI analysis is not configured right now.",
            canRetry: false,
          };
        case "MALFORMED_OUTPUT":
          return {
            formError: "The AI response could not be validated. Try again.",
            canRetry: true,
          };
        case "TIMEOUT":
          return {
            formError: "The AI analysis took too long. Please try again.",
            canRetry: true,
          };
        case "RATE_LIMITED":
          return {
            formError: "OpenAI is rate-limiting requests right now. Please try again in a few minutes.",
            canRetry: true,
          };
        case "QUOTA_EXCEEDED":
          return {
            formError: "AI analysis is temporarily unavailable due to provider quota limits. Please try again later.",
            canRetry: false,
          };
        case "UNAVAILABLE":
          return {
            formError: "There was an issue with the analysis. Please try again later.",
            canRetry: true,
          };
        case "PROVIDER_FAILURE":
        default:
          return {
            formError: "There was an issue with the analysis. Please try again later.",
            canRetry: true,
          };
      }
    }

    console.error("Job analysis action failed with unexpected provider error", {
      jobId: job.id,
      userId: user.id,
      error,
    });

    return {
      formError: "There was an issue with the analysis. Please try again later.",
      canRetry: true,
    };
  }

  try {
    await prisma.$transaction([
      prisma.jobAnalysis.upsert({
        where: {
          jobId: job.id,
        },
        update: result.analysis,
        create: {
          jobId: job.id,
          ...result.analysis,
        },
      }),
      prisma.jobAnalysisRun.create({
        data: {
          jobId: job.id,
          userId: user.id,
        },
      }),
    ]);
  } catch (error) {
    console.error("Job analysis save failed", {
      jobId: job.id,
      userId: user.id,
      error,
    });

    return {
      formError: "The analysis completed, but saving it failed. Please try again in a moment.",
      canRetry: true,
    };
  }

  revalidatePath(`/jobs/${job.id}`);
  redirect(`/jobs/${job.id}`);
}
