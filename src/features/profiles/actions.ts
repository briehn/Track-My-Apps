"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/features/auth/require-user";
import {
  AiUsageFeature,
  completeAiUsageReservation,
  releaseAiUsageReservation,
  reserveAiUsage,
} from "@/features/ai-usage/quota";
import {
  extractProfileSuggestionsFromResumeText,
  ProfileExtractionServiceError,
} from "@/features/profiles/ai-service";
import {
  hasAnyProfileExtractionSuggestions,
  hasExtractableResumeText,
  getProfileFormFieldErrors,
  isResumeTextTooLongForProfileExtraction,
  MAX_PROFILE_RESUME_EXTRACTION_CHARS,
  MIN_PROFILE_RESUME_EXTRACTION_CHARS,
  type ProfileExtractionSuggestion,
  profileFormInputSchema,
  toProfileInput,
  type ProfileFormFieldName,
} from "@/features/profiles/schemas";
import { prisma } from "@/server/db/prisma";

export type UpsertProfileActionState = {
  fieldErrors?: Partial<Record<ProfileFormFieldName, string[]>>;
  formError?: string;
  successMessage?: string;
};

export type ExtractProfileDetailsActionState = {
  formError?: string;
  successMessage?: string;
  suggestions?: ProfileExtractionSuggestion;
};

export type ImportResumeTextActionState = {
  formError?: string;
  successMessage?: string;
  extractedText?: string;
  extractedTextLength?: number;
  fileName?: string;
  suggestions?: ProfileExtractionSuggestion;
};

function mapProfileExtractionErrorToMessage(
  error: ProfileExtractionServiceError,
) {
  switch (error.code) {
    case "NOT_CONFIGURED":
      return "AI profile extraction is not configured right now.";
    case "MALFORMED_OUTPUT":
      return "The AI response could not be validated. Try again.";
    case "TIMEOUT":
      return "The AI extraction took too long. Please try again.";
    case "RATE_LIMITED":
      return "OpenAI is rate-limiting requests right now. Please try again in a few minutes.";
    case "QUOTA_EXCEEDED":
      return "AI profile extraction is temporarily unavailable due to provider quota limits. Please try again later.";
    case "UNAVAILABLE":
    case "PROVIDER_FAILURE":
    default:
      return "There was an issue extracting profile details. Please try again later.";
  }
}

export async function upsertProfile(
  _previousState: UpsertProfileActionState,
  formData: FormData,
): Promise<UpsertProfileActionState> {
  const user = await requireUser();

  const parsedForm = profileFormInputSchema.safeParse({
    targetTitleOption: formData.get("targetTitleOption") || undefined,
    targetTitleOther: formData.get("targetTitleOther"),
    locationPreference: formData.get("locationPreference"),
    workPreferences: formData.getAll("workPreferences"),
    yearsOfExperience: formData.get("yearsOfExperience") || undefined,
    skills: formData.get("skills"),
    experienceSummary: formData.get("experienceSummary"),
    resumeText: formData.get("resumeText"),
    portfolioUrl: formData.get("portfolioUrl"),
    githubUrl: formData.get("githubUrl"),
    linkedinUrl: formData.get("linkedinUrl"),
  });

  if (!parsedForm.success) {
    return {
      fieldErrors: getProfileFormFieldErrors(parsedForm.error),
    };
  }

  const profileInput = toProfileInput(parsedForm.data);

  try {
    await prisma.userProfile.upsert({
      where: {
        userId: user.id,
      },
      create: {
        userId: user.id,
        ...profileInput,
      },
      update: profileInput,
    });
  } catch {
    return {
      formError: "Your profile could not be saved.",
    };
  }

  revalidatePath("/profile");

  return {
    successMessage: "Profile saved.",
  };
}

export async function extractProfileDetails(
  _previousStateIgnored: ExtractProfileDetailsActionState,
): Promise<ExtractProfileDetailsActionState> {
  void _previousStateIgnored;

  const user = await requireUser();
  const profile = await prisma.userProfile.findUnique({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      resumeText: true,
    },
  });

  if (!profile || !hasExtractableResumeText(profile.resumeText)) {
    return {
      formError: `Add and save at least ${MIN_PROFILE_RESUME_EXTRACTION_CHARS} characters of resume text before extracting profile details.`,
    };
  }

  if (isResumeTextTooLongForProfileExtraction(profile.resumeText)) {
    return {
      formError: `Resume text must be ${MAX_PROFILE_RESUME_EXTRACTION_CHARS.toLocaleString()} characters or less before extracting profile details.`,
    };
  }

  const reservation = await reserveAiUsage(
    user.id,
    AiUsageFeature.PROFILE_EXTRACTION,
  );
  if (reservation.status === "rejected") {
    return {
      formError:
        reservation.reason === "CONCURRENCY_LIMIT"
          ? "Another AI request is already processing. Try again shortly."
          : "You've reached today's AI profile extraction limit. Try again tomorrow.",
    };
  }

  try {
    const suggestions = await extractProfileSuggestionsFromResumeText(profile.resumeText);

    try {
      await completeAiUsageReservation(reservation.reservationId);
    } catch {
      console.error("Profile extraction usage completion failed", {
        profileId: profile.id,
        userId: user.id,
      });
      return {
        formError: "The AI extraction completed, but finalizing it failed. Please try again shortly.",
      };
    }

    if (!hasAnyProfileExtractionSuggestions(suggestions)) {
      return {
        formError: "No confident profile suggestions could be extracted from the saved resume text.",
      };
    }

    return {
      successMessage: "Review the AI suggestions before applying them.",
      suggestions,
    };
  } catch (error) {
    await releaseAiUsageReservation(reservation.reservationId);
    if (error instanceof ProfileExtractionServiceError) {
      console.error("Profile extraction action failed", {
        code: error.code,
        userId: user.id,
        profileId: profile.id,
        status: error.details?.status ?? null,
        providerCode: error.details?.code ?? null,
        providerName: error.details?.name ?? null,
        providerRequestId: error.details?.requestId ?? null,
      });
      return {
        formError: mapProfileExtractionErrorToMessage(error),
      };
    }

    console.error("Profile extraction action failed with unexpected provider error", {
      userId: user.id,
      profileId: profile.id,
    });

    return {
      formError: "There was an issue extracting profile details. Please try again later.",
    };
  }
}

export async function importResumeText(
  _previousStateIgnored: ImportResumeTextActionState,
  formData: FormData,
): Promise<ImportResumeTextActionState> {
  void _previousStateIgnored;
  let reservationId: string | null = null;

  try {
    const { extractResumeTextFromUploadFile } = await import(
      "@/features/profiles/resume-import"
    );
    const user = await requireUser();
    const resumeFile = formData.get("resumeFile");

    if (!(resumeFile instanceof File)) {
      return {
        formError: "Select a resume file to import.",
      };
    }

    const result = await extractResumeTextFromUploadFile(resumeFile);
    if (!hasExtractableResumeText(result.extractedText)) {
      return {
        formError: `Add at least ${MIN_PROFILE_RESUME_EXTRACTION_CHARS} characters of readable resume content before extracting profile details.`,
      };
    }

    const reservation = await reserveAiUsage(
      user.id,
      AiUsageFeature.RESUME_EXTRACTION,
    );
    if (reservation.status === "rejected") {
      return {
        formError:
          reservation.reason === "CONCURRENCY_LIMIT"
            ? "Another AI request is already processing. Try again shortly."
            : "You've reached today's AI profile extraction limit. Try again tomorrow.",
      };
    }
    reservationId = reservation.reservationId;

    const suggestions = await extractProfileSuggestionsFromResumeText(
      result.extractedText,
    );
    try {
      await completeAiUsageReservation(reservationId);
    } catch {
      console.error("Resume extraction usage completion failed", { userId: user.id });
      return {
        formError: "The AI extraction completed, but finalizing it failed. Please try again shortly.",
      };
    }
    if (!hasAnyProfileExtractionSuggestions(suggestions)) {
      return {
        formError: "No confident profile suggestions could be extracted from that resume file.",
      };
    }

    return {
      successMessage: `Resume imported from ${resumeFile.name}. Review the suggestions before applying them to your form.`,
      suggestions,
      extractedText: result.extractedText,
      extractedTextLength: result.extractedText.length,
      fileName: resumeFile.name,
    };
  } catch (error) {
    if (reservationId) {
      await releaseAiUsageReservation(reservationId);
    }
    const resumeImportErrorCode =
      error &&
      typeof error === "object" &&
      "code" in error &&
      typeof error.code === "string"
        ? error.code
        : null;

    if (
      error instanceof Error &&
      resumeImportErrorCode &&
      [
        "EMPTY_FILE",
        "FILE_TOO_LARGE",
        "UNSUPPORTED_FILE_TYPE",
        "EXTRACTION_FAILED",
        "EMPTY_EXTRACTED_TEXT",
        "TEXT_TOO_LONG",
      ].includes(resumeImportErrorCode)
    ) {
      return {
        formError: error.message,
      };
    }

    if (error instanceof ProfileExtractionServiceError) {
      console.error("Profile extraction during resume import failed", {
        code: error.code,
        status: error.details?.status ?? null,
        providerCode: error.details?.code ?? null,
        providerName: error.details?.name ?? null,
        providerRequestId: error.details?.requestId ?? null,
      });
      return {
        formError: mapProfileExtractionErrorToMessage(error),
      };
    }

    return {
      formError: "Resume import failed. Try another file or paste text manually.",
    };
  }
}
