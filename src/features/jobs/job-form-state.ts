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

export function toJobFormValues(draft: JobDraft): JobFormValues {
  return {
    company: draft.company,
    title: draft.title,
    location: draft.location,
    remoteType: draft.remoteType,
    employmentType: draft.employmentType,
    source: draft.source,
    url: draft.url,
    salaryMin: draft.salaryMin?.toString(),
    salaryMax: draft.salaryMax?.toString(),
    salaryCurrency: draft.salaryCurrency,
    description: draft.description,
    deadline: toDateInputValue(draft.deadline),
  };
}

function hasMeaningfulValue(value: string | undefined) {
  return Boolean(value?.trim());
}

export function mergeImportedJobDraft(
  currentValues: JobFormValues,
  importedDraft: JobDraft,
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
import type { JobDraft } from "@/features/jobs/schemas";
