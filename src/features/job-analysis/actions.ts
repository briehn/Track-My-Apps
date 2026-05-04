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
    };
  }

  if (!hasAnalyzableJobDescription(job.description)) {
    return {
      formError: "Add a fuller job description before running analysis.",
    };
  }

  if (isJobDescriptionTooLong(job.description)) {
    return {
      formError: "This job description is too long to analyze. Shorten it to 10,000 characters or less.",
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
      };
    }
  }

  try {
    const result = await analyzeJobDescriptionWithOpenAI(job.description);

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
          model: result.usage.model,
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          totalTokens: result.usage.totalTokens,
        },
      }),
    ]);
  } catch (error) {
    if (error instanceof JobAnalysisServiceError) {
      switch (error.code) {
        case "NOT_CONFIGURED":
          return {
            formError: "AI analysis is not configured right now.",
          };
        case "MALFORMED_OUTPUT":
          return {
            formError: "The AI response could not be validated. Try again.",
          };
        case "RATE_LIMITED":
          return {
            formError: "AI analysis is busy right now. Please try again shortly.",
          };
        case "UNAVAILABLE":
          return {
            formError: "AI analysis is temporarily unavailable. Try again in a moment.",
          };
        case "PROVIDER_FAILURE":
        default:
          return {
            formError: "The AI request failed. Try again in a moment.",
          };
      }
    }

    return {
      formError: "The AI request failed. Try again in a moment.",
    };
  }

  revalidatePath(`/jobs/${job.id}`);
  redirect(`/jobs/${job.id}`);
}
