import { ZodError, z } from "zod";

import {
  normalizeTargetTitleToPredefinedOption,
  TARGET_TITLE_OPTIONS,
  TARGET_TITLE_OTHER_OPTION,
  YEARS_OF_EXPERIENCE_OPTIONS,
  type WorkPreferenceOption,
} from "@/features/profiles/options";
import { isSafeExternalUrl, safeExternalUrlSchema } from "@/lib/url";

export const MIN_PROFILE_RESUME_EXTRACTION_CHARS = 200;
export const MAX_PROFILE_RESUME_EXTRACTION_CHARS = 12_000;
const MAX_PROFILE_SUGGESTED_SKILLS = 20;

const optionalTrimmedString = z.preprocess(
  (value) =>
    value === null || (typeof value === "string" && value.trim() === "")
      ? undefined
      : value,
  z.string().trim().optional(),
);

const optionalUrl = z.preprocess(
  (value) =>
    value === null || (typeof value === "string" && value.trim() === "")
      ? undefined
      : value,
  safeExternalUrlSchema.optional(),
);

function dedupeStringsCaseInsensitive(values: string[]) {
  const seen = new Set<string>();
  const dedupedValues: string[] = [];

  for (const value of values) {
    const normalizedKey = value.toLocaleLowerCase();

    if (seen.has(normalizedKey)) {
      continue;
    }

    seen.add(normalizedKey);
    dedupedValues.push(value);
  }

  return dedupedValues;
}

export function normalizeSkillsInput(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  const normalizedValues = value
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  return dedupeStringsCaseInsensitive(normalizedValues);
}

function dedupeWorkPreferences(values: WorkPreferenceOption[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}

function normalizeNullableText(value: string | null) {
  const trimmedValue = value?.trim() ?? "";
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function normalizeYearsOfExperienceSignal(
  value: string | null | undefined,
): (typeof YEARS_OF_EXPERIENCE_OPTIONS)[number] | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim().toLocaleLowerCase();

  if (!normalizedValue) {
    return null;
  }

  const canonicalEnumValue = normalizedValue.toUpperCase().replace(/\s+/g, "_");

  if (
    YEARS_OF_EXPERIENCE_OPTIONS.includes(
      canonicalEnumValue as (typeof YEARS_OF_EXPERIENCE_OPTIONS)[number],
    )
  ) {
    return canonicalEnumValue as (typeof YEARS_OF_EXPERIENCE_OPTIONS)[number];
  }

  const noExperienceSignals = [
    "entry level",
    "entry-level",
    "recent graduate",
    "new graduate",
    "bootcamp graduate",
    "internship only",
    "internship-only",
    "no professional experience",
    "no field experience",
    "no industry experience",
    "career changer with no experience",
  ];

  if (noExperienceSignals.some((signal) => normalizedValue.includes(signal))) {
    return "ZERO_TO_ONE";
  }

  if (/\b0(\.0+)?\s*(\+)?\s*(years?|yrs?)\b/.test(normalizedValue)) {
    return "ZERO_TO_ONE";
  }

  if (/\b(less than|under)\s*1\s*(year|yr)\b/.test(normalizedValue)) {
    return "ZERO_TO_ONE";
  }

  if (/\b0\s*-\s*1\s*(years?|yrs?)\b/.test(normalizedValue)) {
    return "ZERO_TO_ONE";
  }

  if (/\b1\s*-\s*2\s*(years?|yrs?)\b/.test(normalizedValue)) {
    return "ONE_TO_TWO";
  }

  if (/\b3\s*-\s*5\s*(years?|yrs?)\b/.test(normalizedValue)) {
    return "THREE_TO_FIVE";
  }

  if (/\b6\s*-\s*9\s*(years?|yrs?)\b/.test(normalizedValue)) {
    return "SIX_TO_NINE";
  }

  if (/\b10\s*(\+|plus)\s*(years?|yrs?)\b/.test(normalizedValue)) {
    return "TEN_PLUS";
  }

  if (/\b(1|one)\s*(to|-)\s*(2|two)\s*(years?|yrs?)\b/.test(normalizedValue)) {
    return "ONE_TO_TWO";
  }

  if (/\b(3|three)\s*(to|-)\s*(5|five)\s*(years?|yrs?)\b/.test(normalizedValue)) {
    return "THREE_TO_FIVE";
  }

  if (/\b(6|six)\s*(to|-)\s*(9|nine)\s*(years?|yrs?)\b/.test(normalizedValue)) {
    return "SIX_TO_NINE";
  }

  if (/\b(10|ten)\s*(\+|plus|or more)\b/.test(normalizedValue)) {
    return "TEN_PLUS";
  }

  if (/\b3\+?\s*(years?|yrs?)\b/.test(normalizedValue)) {
    return "THREE_TO_FIVE";
  }

  return null;
}

function normalizeUrlOrNull(value: string | null) {
  const trimmedValue = value?.trim() ?? "";

  if (!trimmedValue) {
    return null;
  }

  return isSafeExternalUrl(trimmedValue) ? trimmedValue : null;
}

function normalizeWorkPreferencesInput(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return dedupeWorkPreferences(
    value.filter((entry): entry is WorkPreferenceOption => typeof entry === "string"),
  );
}

const targetTitleOptionSchema = z
  .union([z.enum(TARGET_TITLE_OPTIONS), z.literal(TARGET_TITLE_OTHER_OPTION)])
  .optional();

const targetTitleFieldsSchema = z
  .object({
    targetTitleOption: targetTitleOptionSchema,
    targetTitleOther: optionalTrimmedString,
  })
  .superRefine((input, context) => {
    if (input.targetTitleOption === TARGET_TITLE_OTHER_OPTION && !input.targetTitleOther) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter your target title.",
        path: ["targetTitleOther"],
      });
    }
  });

export const PROFILE_FORM_FIELD_NAMES = [
  "targetTitleOption",
  "targetTitleOther",
  "locationPreference",
  "workPreferences",
  "yearsOfExperience",
  "skills",
  "experienceSummary",
  "resumeText",
  "portfolioUrl",
  "githubUrl",
  "linkedinUrl",
] as const;

export type ProfileFormFieldName = (typeof PROFILE_FORM_FIELD_NAMES)[number];

function isProfileFormFieldName(value: string): value is ProfileFormFieldName {
  return PROFILE_FORM_FIELD_NAMES.some((fieldName) => fieldName === value);
}

export const profileFormInputSchema = targetTitleFieldsSchema.and(
  z.object({
    locationPreference: optionalTrimmedString,
    workPreferences: z.preprocess(
      normalizeWorkPreferencesInput,
      z.array(z.enum(["ONSITE", "HYBRID", "REMOTE"])).max(3),
    ),
    yearsOfExperience: z.enum(YEARS_OF_EXPERIENCE_OPTIONS).optional(),
    skills: z.preprocess(
      (value) => (typeof value === "string" ? normalizeSkillsInput(value) : value),
      z.array(z.string().min(1)).max(100, "Enter 100 skills or fewer."),
    ),
    experienceSummary: optionalTrimmedString,
    resumeText: optionalTrimmedString,
    portfolioUrl: optionalUrl,
    githubUrl: optionalUrl,
    linkedinUrl: optionalUrl,
  })
);

export function toProfileInput(input: z.infer<typeof profileFormInputSchema>) {
  return {
    targetTitle:
      input.targetTitleOption === TARGET_TITLE_OTHER_OPTION
        ? input.targetTitleOther
        : input.targetTitleOption,
    locationPreference: input.locationPreference,
    workPreferences: input.workPreferences,
    yearsOfExperience: input.yearsOfExperience,
    skills: input.skills,
    experienceSummary: input.experienceSummary,
    resumeText: input.resumeText,
    portfolioUrl: input.portfolioUrl,
    githubUrl: input.githubUrl,
    linkedinUrl: input.linkedinUrl,
  };
}

export const profileFormSchema = profileFormInputSchema.transform(toProfileInput);

export type ProfileInput = ReturnType<typeof toProfileInput>;

export const aiProfileExtractionResponseSchema = z
  .object({
    targetTitle: z.string().trim().nullable(),
    yearsOfExperience: z.string().trim().nullable(),
    skills: z.array(z.string().trim()),
    experienceSummary: z.string().trim().nullable(),
    portfolioUrl: z.string().trim().nullable(),
    githubUrl: z.string().trim().nullable(),
    linkedinUrl: z.string().trim().nullable(),
    workPreferences: z.array(z.enum(["ONSITE", "HYBRID", "REMOTE"])),
  })
  .strict();

export const normalizedProfileExtractionSuggestionSchema = z
  .object({
    targetTitle: z.string().trim().min(1).nullable(),
    yearsOfExperience: z.enum(YEARS_OF_EXPERIENCE_OPTIONS).nullable(),
    skills: z.array(z.string().trim().min(1)).max(MAX_PROFILE_SUGGESTED_SKILLS),
    experienceSummary: z.string().trim().min(1).nullable(),
    portfolioUrl: safeExternalUrlSchema.nullable(),
    githubUrl: safeExternalUrlSchema.nullable(),
    linkedinUrl: safeExternalUrlSchema.nullable(),
    workPreferences: z.array(z.enum(["ONSITE", "HYBRID", "REMOTE"])).max(3),
  })
  .strict();

export type AIProfileExtractionResponse = z.infer<typeof aiProfileExtractionResponseSchema>;
export type ProfileExtractionSuggestion = z.infer<
  typeof normalizedProfileExtractionSuggestionSchema
>;

export function hasExtractableResumeText(
  resumeText: string | null | undefined,
): resumeText is string {
  return Boolean(resumeText && resumeText.trim().length >= MIN_PROFILE_RESUME_EXTRACTION_CHARS);
}

export function isResumeTextTooLongForProfileExtraction(resumeText: string) {
  return resumeText.length > MAX_PROFILE_RESUME_EXTRACTION_CHARS;
}

export function normalizeProfileExtractionSuggestion(
  input: AIProfileExtractionResponse,
): ProfileExtractionSuggestion {
  const normalizedTargetTitle = normalizeNullableText(input.targetTitle);
  const mappedTargetTitle = normalizeTargetTitleToPredefinedOption(normalizedTargetTitle);

  return normalizedProfileExtractionSuggestionSchema.parse({
    targetTitle: mappedTargetTitle ?? normalizedTargetTitle,
    yearsOfExperience: normalizeYearsOfExperienceSignal(input.yearsOfExperience),
    skills: dedupeStringsCaseInsensitive(input.skills.map((skill) => skill.trim()))
      .filter((skill) => skill.length > 0)
      .slice(0, MAX_PROFILE_SUGGESTED_SKILLS),
    experienceSummary: normalizeNullableText(input.experienceSummary),
    portfolioUrl: normalizeUrlOrNull(input.portfolioUrl),
    githubUrl: normalizeUrlOrNull(input.githubUrl),
    linkedinUrl: normalizeUrlOrNull(input.linkedinUrl),
    workPreferences: dedupeWorkPreferences(input.workPreferences),
  });
}

export function hasAnyProfileExtractionSuggestions(
  suggestions: ProfileExtractionSuggestion,
) {
  return Boolean(
    suggestions.targetTitle ||
      suggestions.yearsOfExperience ||
      suggestions.skills.length > 0 ||
      suggestions.experienceSummary ||
      suggestions.portfolioUrl ||
      suggestions.githubUrl ||
      suggestions.linkedinUrl ||
      suggestions.workPreferences.length > 0,
  );
}

export function getProfileFormFieldErrors(error: ZodError) {
  const fieldErrors: Partial<Record<ProfileFormFieldName, string[]>> = {};

  for (const issue of error.issues) {
    const fieldName = issue.path[0];

    if (typeof fieldName !== "string" || !isProfileFormFieldName(fieldName)) {
      continue;
    }

    const existingErrors = fieldErrors[fieldName] ?? [];
    fieldErrors[fieldName] = [...existingErrors, issue.message];
  }

  return fieldErrors;
}
