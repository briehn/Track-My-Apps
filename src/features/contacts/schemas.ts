import { z } from "zod";

import { safeExternalUrlSchema } from "@/lib/url";
import { JOB_CONTACT_TYPES, OUTREACH_STATUSES } from "@/features/contacts/options";

const optionalTrimmedString = (maximumLength: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(maximumLength).optional(),
  );

const optionalProfileUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  safeExternalUrlSchema.optional(),
);

const optionalEmail = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().email("Enter a valid email address.").max(254).optional(),
);

const optionalDate = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue === "" ? undefined : new Date(`${trimmedValue}T00:00:00.000Z`);
}, z.date("Enter a valid date.").optional());

const contactFields = {
  name: z.string().trim().min(1, "Name is required.").max(120),
  title: optionalTrimmedString(120),
  company: optionalTrimmedString(120),
  profileUrl: optionalProfileUrl,
  email: optionalEmail,
  contactType: z.enum(JOB_CONTACT_TYPES),
  relevanceNotes: optionalTrimmedString(1_000),
  outreachStatus: z.enum(OUTREACH_STATUSES),
  lastContactedAt: optionalDate,
  followUpAt: optionalDate,
  notes: optionalTrimmedString(2_000),
};

export const createJobContactSchema = z.object({
  jobId: z.string().min(1, "Job is required."),
  ...contactFields,
});

export type CreateJobContactInput = z.infer<typeof createJobContactSchema>;

export const updateJobContactSchema = createJobContactSchema.extend({
  contactId: z.string().min(1, "Contact is required."),
});

export type UpdateJobContactInput = z.infer<typeof updateJobContactSchema>;

export const deleteJobContactSchema = z.object({
  jobId: z.string().min(1, "Job is required."),
  contactId: z.string().min(1, "Contact is required."),
});

export const updateOutreachStatusSchema = deleteJobContactSchema.extend({
  outreachStatus: z.enum(OUTREACH_STATUSES),
});
