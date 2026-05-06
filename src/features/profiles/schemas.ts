import { z } from "zod";

const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional(),
);

const optionalUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().url("Enter a valid URL.").optional(),
);

const optionalInteger = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue === "" ? undefined : Number(trimmedValue);
}, z.number().int("Enter a whole number.").min(0, "Enter 0 or more years.").max(80, "Enter a realistic number of years.").optional());

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

export const profileSchema = z.object({
  targetTitle: optionalTrimmedString,
  locationPreference: optionalTrimmedString,
  workPreference: z.enum(["ONSITE", "HYBRID", "REMOTE"]).optional(),
  yearsOfExperience: optionalInteger,
  skills: z.preprocess(
    (value) => (typeof value === "string" ? normalizeSkillsInput(value) : value),
    z.array(z.string().min(1)).max(100, "Enter 100 skills or fewer."),
  ),
  experienceSummary: optionalTrimmedString,
  resumeText: optionalTrimmedString,
  portfolioUrl: optionalUrl,
  githubUrl: optionalUrl,
  linkedinUrl: optionalUrl,
});

export type ProfileInput = z.infer<typeof profileSchema>;
