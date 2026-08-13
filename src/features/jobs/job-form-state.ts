import type { JobImportSeed } from "@/features/jobs/schemas";

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

function toDateInputValue(date: Date | undefined) {
  return date?.toISOString().slice(0, 10);
}

export function toJobFormValues(seed: JobImportSeed): JobFormValues {
  return {
    company: seed.company,
    title: seed.title,
    location: seed.location,
    remoteType: seed.remoteType,
    employmentType: seed.employmentType,
    source: seed.source,
    url: seed.url,
    salaryMin: seed.salaryMin?.toString(),
    salaryMax: seed.salaryMax?.toString(),
    salaryCurrency: seed.salaryCurrency,
    description: seed.description,
    deadline: toDateInputValue(seed.deadline),
  };
}

function hasMeaningfulValue(value: string | undefined) {
  return Boolean(value?.trim());
}

export function mergeImportedJobDraft(
  currentValues: JobFormValues,
  importedDraft: JobImportSeed,
): JobFormValues {
  const importedValues = toJobFormValues(importedDraft);
  const mergedValues = { ...currentValues };

  for (const fieldName of jobFormFieldNames) {
    const importedValue = importedValues[fieldName];

    if (!hasMeaningfulValue(currentValues[fieldName]) && importedValue !== undefined) {
      mergedValues[fieldName] = importedValue;
    }
  }

  return mergedValues;
}

export function getFirstInvalidJobFormField(errors?: JobFormFieldErrors) {
  return jobFormFieldNames.find((fieldName) => errors?.[fieldName]?.length);
}
