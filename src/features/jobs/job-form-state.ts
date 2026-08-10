export const jobFormFieldNames = [
  "company",
  "title",
  "location",
  "remoteType",
  "employmentType",
  "source",
  "url",
  "salaryMin",
  "salaryMax",
  "salaryCurrency",
  "description",
  "deadline",
] as const;

export type JobFormFieldName = (typeof jobFormFieldNames)[number];

export type JobFormFieldErrors = Partial<
  Record<JobFormFieldName, string[]>
>;

export type JobFormValues = Partial<Record<JobFormFieldName, string>>;

export function getFirstInvalidJobFormField(errors?: JobFormFieldErrors) {
  return jobFormFieldNames.find((fieldName) => errors?.[fieldName]?.length);
}
