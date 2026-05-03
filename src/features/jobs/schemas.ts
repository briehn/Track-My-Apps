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
}, z.number().int("Enter a whole number.").nonnegative("Enter a positive number.").optional());

const optionalDate = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue === "" ? undefined : new Date(`${trimmedValue}T00:00:00.000Z`);
}, z.date().optional());

export const createJobSchema = z
  .object({
    company: z.string().trim().min(1, "Company is required."),
    title: z.string().trim().min(1, "Title is required."),
    location: optionalTrimmedString,
    remoteType: z.enum(["ONSITE", "HYBRID", "REMOTE"]).optional(),
    employmentType: z
      .enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "TEMPORARY"])
      .optional(),
    source: optionalTrimmedString,
    url: optionalUrl,
    salaryMin: optionalInteger,
    salaryMax: optionalInteger,
    salaryCurrency: optionalTrimmedString,
    description: optionalTrimmedString,
    deadline: optionalDate,
  })
  .refine(
    (input) =>
      input.salaryMin === undefined ||
      input.salaryMax === undefined ||
      input.salaryMin <= input.salaryMax,
    {
      message: "Minimum salary must be less than or equal to maximum salary.",
      path: ["salaryMax"],
    },
  );

export type CreateJobInput = z.infer<typeof createJobSchema>;
