import { ZodError, z } from "zod";

import {
  TARGET_TITLE_OPTIONS,
  TARGET_TITLE_OTHER_OPTION,
  YEARS_OF_EXPERIENCE_OPTIONS,
  type WorkPreferenceOption,
} from "@/features/profiles/options";

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
  z.string().trim().url("Enter a valid URL.").optional(),
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
