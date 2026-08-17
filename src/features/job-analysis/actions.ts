"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/features/auth/require-user";
import {
  AiUsageFeature,
  completeAiUsageReservation,
  releaseAiUsageReservation,
  reserveAiUsage,
} from "@/features/ai-usage/quota";
import {
  analyzeJobDescriptionSchema,
  hasAnalyzableJobDescription,
  isJobDescriptionTooLong,
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

type RuntimeDataModelField = {
  name: string;
};

type RuntimeDataModelModel = {
  fields: RuntimeDataModelField[];
};

type RuntimeDataModel = {
  models: Record<string, RuntimeDataModelModel>;
};

type ProviderErrorDiagnostics = {
  status: number | null;
  code: string | null;
  name: string | null;
  requestId: string | null;
};

type PersistenceErrorDiagnostics = {
  code: string | null;
  message: string | null;
  name: string | null;
};

const JOB_ANALYSIS_USAGE_FIELDS = [
  "model",
  "inputTokens",
  "outputTokens",
  "totalTokens",
] as const;

let metadataSupportCache: boolean | null = null;

function isRuntimeDataModel(value: unknown): value is RuntimeDataModel {
  if (!value || typeof value !== "object") {
    return false;
  }

  if (!("models" in value) || typeof value.models !== "object" || !value.models) {
    return false;
  }

  return true;
}

function supportsJobAnalysisRunUsageMetadata(): boolean {
  if (metadataSupportCache !== null) {
    return metadataSupportCache;
  }

  const runtimeDataModel = Reflect.get(prisma, "_runtimeDataModel");

  if (!isRuntimeDataModel(runtimeDataModel)) {
    metadataSupportCache = false;
    return metadataSupportCache;
  }

  const analysisRunModel = runtimeDataModel.models.JobAnalysisRun;

  if (!analysisRunModel || !Array.isArray(analysisRunModel.fields)) {
    metadataSupportCache = false;
    return metadataSupportCache;
  }

  const fieldNames = new Set(analysisRunModel.fields.map((field) => field.name));
  metadataSupportCache = JOB_ANALYSIS_USAGE_FIELDS.every((fieldName) =>
    fieldNames.has(fieldName),
  );

  return metadataSupportCache;
}

function getProviderErrorDiagnostics(error: unknown): ProviderErrorDiagnostics {
  if (!error || typeof error !== "object") {
    return {
      status: null,
      code: null,
      name: null,
      requestId: null,
    };
  }

  return {
    status:
      "status" in error && typeof error.status === "number" ? error.status : null,
    code: "code" in error && typeof error.code === "string" ? error.code : null,
    name: "name" in error && typeof error.name === "string" ? error.name : null,
    requestId:
      "requestID" in error && typeof error.requestID === "string"
        ? error.requestID
        : null,
  };
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

  const reservation = await reserveAiUsage(user.id, AiUsageFeature.JOB_ANALYSIS);
  if (reservation.status === "rejected") {
    return {
      formError:
        reservation.reason === "CONCURRENCY_LIMIT"
          ? "Another AI request is already processing. Try again shortly."
          : "You have reached today's AI analysis limit. Please try again tomorrow.",
      canRetry: false,
    };
  }

  let result: Awaited<ReturnType<typeof analyzeJobDescriptionWithOpenAI>>;

  try {
    result = await analyzeJobDescriptionWithOpenAI(job.description);
  } catch (error) {
    await releaseAiUsageReservation(reservation.reservationId);
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

    const providerErrorDiagnostics = getProviderErrorDiagnostics(error);

    console.error("Job analysis action failed with unexpected provider error", {
      jobId: job.id,
      userId: user.id,
      status: providerErrorDiagnostics.status,
      providerCode: providerErrorDiagnostics.code,
      providerName: providerErrorDiagnostics.name,
      providerRequestId: providerErrorDiagnostics.requestId,
    });

    return {
      formError: "There was an issue with the analysis. Please try again later.",
      canRetry: true,
    };
  }

  try {
    await completeAiUsageReservation(reservation.reservationId);
  } catch {
    console.error("Job analysis usage completion failed", { jobId: job.id, userId: user.id });
    return {
      formError: "The AI analysis completed, but finalizing it failed. Please try again shortly.",
      canRetry: true,
    };
  }

  try {
    const runData = supportsJobAnalysisRunUsageMetadata()
      ? {
          jobId: job.id,
          userId: user.id,
          model: result.usage.model,
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          totalTokens: result.usage.totalTokens,
        }
      : {
          jobId: job.id,
          userId: user.id,
        };

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
        data: runData,
      }),
    ]);
  } catch (error) {
    const persistenceErrorDiagnostics = getPersistenceErrorDiagnostics(error);

    console.error("Job analysis save failed", {
      jobId: job.id,
      userId: user.id,
      code: persistenceErrorDiagnostics.code,
      name: persistenceErrorDiagnostics.name,
      message: persistenceErrorDiagnostics.message,
    });

    return {
      formError: "The analysis completed, but saving it failed. Please try again in a moment.",
      canRetry: true,
    };
  }

  revalidatePath(`/jobs/${job.id}`);
  redirect(`/jobs/${job.id}`);
}
