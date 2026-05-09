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
export type PredefinedTargetTitle = (typeof TARGET_TITLE_OPTIONS)[number];

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

function normalizeTitleKey(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const TARGET_TITLE_NORMALIZATION_ALIASES: Record<string, (typeof TARGET_TITLE_OPTIONS)[number]> =
  {
    "software developer": "Software Engineer",
    "software engineer": "Software Engineer",
    "frontend": "Frontend Engineer",
    "front end": "Frontend Engineer",
    "frontend developer": "Frontend Engineer",
    "front end developer": "Frontend Engineer",
    "front end engineer": "Frontend Engineer",
    "frontend engineer": "Frontend Engineer",
    "backend": "Backend Engineer",
    "back end": "Backend Engineer",
    "backend developer": "Backend Engineer",
    "back end developer": "Backend Engineer",
    "back end engineer": "Backend Engineer",
    "backend engineer": "Backend Engineer",
    "full stack developer": "Full-Stack Engineer",
    "full stack engineer": "Full-Stack Engineer",
    "fullstack developer": "Full-Stack Engineer",
    "fullstack engineer": "Full-Stack Engineer",
  };

export function isPredefinedTargetTitle(
  value: string | null | undefined,
): value is PredefinedTargetTitle {
  if (!value) {
    return false;
  }

  return TARGET_TITLE_OPTIONS.some((option) => option === value);
}

export function normalizeTargetTitleToPredefinedOption(
  value: string | null | undefined,
): PredefinedTargetTitle | null {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (isPredefinedTargetTitle(trimmedValue)) {
    return trimmedValue;
  }

  const normalizedKey = normalizeTitleKey(trimmedValue);
  const mappedAlias = TARGET_TITLE_NORMALIZATION_ALIASES[normalizedKey];

  if (mappedAlias) {
    return mappedAlias;
  }

  const exactNormalizedMatch = TARGET_TITLE_OPTIONS.find(
    (option) => normalizeTitleKey(option) === normalizedKey,
  );

  return exactNormalizedMatch ?? null;
}
