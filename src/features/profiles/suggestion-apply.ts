import {
  normalizeTargetTitleToPredefinedOption,
  TARGET_TITLE_OTHER_OPTION,
} from "@/features/profiles/options";
import type { ProfileFormValues } from "@/features/profiles/components/profile-form-fields";
import type { ProfileExtractionSuggestion } from "@/features/profiles/schemas";

export function mergeProfileExtractionSuggestionsIntoFormValues(
  currentValues: ProfileFormValues,
  suggestions: ProfileExtractionSuggestion,
): ProfileFormValues {
  const nextValues: ProfileFormValues = {
    ...currentValues,
  };

  if (suggestions.targetTitle) {
    const mappedTargetTitle = normalizeTargetTitleToPredefinedOption(
      suggestions.targetTitle,
    );

    if (mappedTargetTitle) {
      nextValues.targetTitleOption = mappedTargetTitle;
      nextValues.targetTitleOther = "";
    } else {
      nextValues.targetTitleOption = TARGET_TITLE_OTHER_OPTION;
      nextValues.targetTitleOther = suggestions.targetTitle;
    }
  }

  if (suggestions.yearsOfExperience) {
    nextValues.yearsOfExperience = suggestions.yearsOfExperience;
  }

  if (suggestions.skills.length > 0) {
    nextValues.skills = suggestions.skills.join("\n");
  }

  if (suggestions.experienceSummary) {
    nextValues.experienceSummary = suggestions.experienceSummary;
  }

  if (suggestions.portfolioUrl) {
    nextValues.portfolioUrl = suggestions.portfolioUrl;
  }

  if (suggestions.githubUrl) {
    nextValues.githubUrl = suggestions.githubUrl;
  }

  if (suggestions.linkedinUrl) {
    nextValues.linkedinUrl = suggestions.linkedinUrl;
  }

  if (suggestions.workPreferences.length > 0) {
    nextValues.workPreferences = suggestions.workPreferences;
  }

  return nextValues;
}
