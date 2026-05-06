export const TARGET_TITLE_OPTIONS = [
  "Software Engineer",
  "Frontend Engineer",
  "Backend Engineer",
  "Full-Stack Engineer",
  "Platform Engineer",
  "DevOps Engineer",
  "Data Engineer",
  "Machine Learning Engineer",
  "Product Manager",
  "Product Designer",
] as const;

export const TARGET_TITLE_OTHER_OPTION = "OTHER" as const;

export const YEARS_OF_EXPERIENCE_OPTIONS = [
  "ZERO_TO_ONE",
  "ONE_TO_TWO",
  "THREE_TO_FIVE",
  "SIX_TO_NINE",
  "TEN_PLUS",
] as const;

export const yearsOfExperienceLabels: Record<
  YearsOfExperienceOption,
  string
> = {
  ZERO_TO_ONE: "0-1 years",
  ONE_TO_TWO: "1-2 years",
  THREE_TO_FIVE: "3-5 years",
  SIX_TO_NINE: "6-9 years",
  TEN_PLUS: "10+ years",
};

export const locationPreferenceSuggestions = [
  "Open to relocate",
  "Remote within current country",
  "Remote within Eastern Time",
  "Specific metro area only",
  "No strong preference",
] as const;

export const workPreferenceOptions = [
  {
    value: "ONSITE",
    label: "Onsite",
    description: "Open to in-person roles.",
  },
  {
    value: "HYBRID",
    label: "Hybrid",
    description: "Open to partially in-office roles.",
  },
  {
    value: "REMOTE",
    label: "Remote",
    description: "Open to fully remote roles.",
  },
] as const;

export type YearsOfExperienceOption = (typeof YEARS_OF_EXPERIENCE_OPTIONS)[number];

export type WorkPreferenceOption = (typeof workPreferenceOptions)[number]["value"];

export function isPredefinedTargetTitle(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return TARGET_TITLE_OPTIONS.some((option) => option === value);
}
