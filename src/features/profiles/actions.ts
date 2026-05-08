"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/features/auth/require-user";
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

  try {
    const suggestions = await extractProfileSuggestionsFromResumeText(profile.resumeText);

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

      switch (error.code) {
        case "NOT_CONFIGURED":
          return {
            formError: "AI profile extraction is not configured right now.",
          };
        case "MALFORMED_OUTPUT":
          return {
            formError: "The AI response could not be validated. Try again.",
          };
        case "TIMEOUT":
          return {
            formError: "The AI extraction took too long. Please try again.",
          };
        case "RATE_LIMITED":
          return {
            formError: "OpenAI is rate-limiting requests right now. Please try again in a few minutes.",
          };
        case "QUOTA_EXCEEDED":
          return {
            formError: "AI profile extraction is temporarily unavailable due to provider quota limits. Please try again later.",
          };
        case "UNAVAILABLE":
        case "PROVIDER_FAILURE":
        default:
          return {
            formError: "There was an issue extracting profile details. Please try again later.",
          };
      }
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
