import {
  JOB_IMPORT_FIELDS,
  type JobImportColumn,
  type JobImportColumnMapping,
  type JobImportField,
} from "@/features/jobs/import-mapping";
import { safeExternalUrlSchema } from "@/lib/url";

const containsLetter = /[A-Za-z]/;

const IMPORT_STATUS_MAP: Record<string, "SAVED" | "APPLIED" | "INTERVIEWING" | "OFFER" | "REJECTED" | "ARCHIVED"> =
  {
    saved: "SAVED",
    applied: "APPLIED",
    interviewing: "INTERVIEWING",
    interview: "INTERVIEWING",
    offer: "OFFER",
    offered: "OFFER",
    rejected: "REJECTED",
    rejection: "REJECTED",
    archived: "ARCHIVED",
  };

const IMPORT_REMOTE_TYPE_MAP: Record<string, "ONSITE" | "HYBRID" | "REMOTE"> = {
  onsite: "ONSITE",
  "on site": "ONSITE",
  hybrid: "HYBRID",
  remote: "REMOTE",
};

const IMPORT_EMPLOYMENT_TYPE_MAP: Record<
  string,
  "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "TEMPORARY"
> = {
  "full time": "FULL_TIME",
  fulltime: "FULL_TIME",
  "part time": "PART_TIME",
  parttime: "PART_TIME",
  contract: "CONTRACT",
  contractor: "CONTRACT",
  internship: "INTERNSHIP",
  intern: "INTERNSHIP",
  temporary: "TEMPORARY",
  temp: "TEMPORARY",
};

export type JobImportPreviewRow = {
  duplicateReason: string | null;
  errors: string[];
  fieldValues: Partial<Record<JobImportField, string>>;
  outcome: "valid" | "invalid" | "duplicate";
  rowNumber: number;
};

export type JobImportPreviewResult = {
  invalidRowCount: number;
  likelyDuplicateCount: number;
  rows: JobImportPreviewRow[];
  validRowCount: number;
};

export type ExistingJobDuplicateSignals = {
  normalizedCompanyTitlePairs: Set<string>;
  normalizedUrls: Set<string>;
};

export type ImportableJobRecord = {
  company: string;
  deadline?: Date;
  description?: string;
  employmentType?: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "TEMPORARY";
  followUpAt?: Date;
  location?: string;
  remoteType?: "ONSITE" | "HYBRID" | "REMOTE";
  salaryMax?: number;
  salaryMin?: number;
  source?: string;
  status: "SAVED" | "APPLIED" | "INTERVIEWING" | "OFFER" | "REJECTED" | "ARCHIVED";
  title: string;
  url?: string;
};

function normalizeLabel(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeCell(value: string | undefined) {
  return (value ?? "").trim();
}

function normalizeDuplicateCompanyTitle(company: string, title: string) {
  return `${normalizeLabel(company)}::${normalizeLabel(title)}`;
}

function normalizeDuplicateUrl(url: string) {
  return url.trim().toLocaleLowerCase();
}

function parseImportInteger(value: string) {
  const normalizedValue = value.replace(/,/g, "").trim();

  if (!/^\d+$/.test(normalizedValue)) {
    return null;
  }

  return Number(normalizedValue);
}

function parseImportDate(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const isoDateMatch = /^(\d{4})[-/](\d{2})[-/](\d{2})$/.exec(trimmedValue);

  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    const normalizedDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);

    if (
      normalizedDate.getUTCFullYear() === Number(year) &&
      normalizedDate.getUTCMonth() + 1 === Number(month) &&
      normalizedDate.getUTCDate() === Number(day)
    ) {
      return normalizedDate;
    }

    return undefined;
  }

  const monthFirstDateMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmedValue);

  if (monthFirstDateMatch) {
    const [, month, day, year] = monthFirstDateMatch;
    const normalizedMonth = month.padStart(2, "0");
    const normalizedDay = day.padStart(2, "0");
    const normalizedDate = new Date(
      `${year}-${normalizedMonth}-${normalizedDay}T00:00:00.000Z`,
    );

    if (
      normalizedDate.getUTCFullYear() === Number(year) &&
      normalizedDate.getUTCMonth() + 1 === Number(normalizedMonth) &&
      normalizedDate.getUTCDate() === Number(normalizedDay)
    ) {
      return normalizedDate;
    }

    return undefined;
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmedValue)) {
    const normalizedDate = new Date(trimmedValue);
    return Number.isNaN(normalizedDate.getTime()) ? undefined : normalizedDate;
  }

  return undefined;
}

function normalizeMappedFieldValues(
  row: Record<string, string>,
  mapping: JobImportColumnMapping,
) {
  const fieldValues: Partial<Record<JobImportField, string>> = {};

  for (const { field } of JOB_IMPORT_FIELDS) {
    const columnKey = mapping[field];

    if (!columnKey) {
      continue;
    }

    fieldValues[field] = normalizeCell(row[columnKey]);
  }

  return fieldValues;
}

function getRequiredMappingErrors(mapping: JobImportColumnMapping, columns: JobImportColumn[]) {
  const errors: string[] = [];
  const availableColumnKeys = new Set(columns.map((column) => column.key));

  for (const fieldConfig of JOB_IMPORT_FIELDS) {
    const columnKey = mapping[fieldConfig.field];

    if (fieldConfig.required && !columnKey) {
      errors.push(`${fieldConfig.label} must be mapped before previewing the import.`);
    }

    if (columnKey && !availableColumnKeys.has(columnKey)) {
      errors.push(`${fieldConfig.label} is mapped to an invalid column.`);
    }
  }

  return errors;
}

function validateHumanReadableRequiredString(value: string, fieldLabel: string, errors: string[]) {
  if (!value) {
    errors.push(`${fieldLabel} is required.`);
    return;
  }

  if (!containsLetter.test(value)) {
    errors.push(`${fieldLabel} must include at least one letter.`);
  }
}

function buildDuplicateSignals(
  existingJobs: Array<{ company: string; title: string; url: string | null }>,
): ExistingJobDuplicateSignals {
  return {
    normalizedCompanyTitlePairs: new Set(
      existingJobs.map((job) => normalizeDuplicateCompanyTitle(job.company, job.title)),
    ),
    normalizedUrls: new Set(
      existingJobs
        .map((job) => job.url)
        .filter((url): url is string => Boolean(url))
        .map((url) => normalizeDuplicateUrl(url)),
    ),
  };
}

function detectDuplicateReason(
  jobRecord: ImportableJobRecord,
  duplicateSignals: ExistingJobDuplicateSignals,
) {
  if (jobRecord.url) {
    const normalizedUrl = normalizeDuplicateUrl(jobRecord.url);

    if (duplicateSignals.normalizedUrls.has(normalizedUrl)) {
      return "Matches an existing job by URL.";
    }
  }

  const normalizedCompanyTitle = normalizeDuplicateCompanyTitle(
    jobRecord.company,
    jobRecord.title,
  );

  if (duplicateSignals.normalizedCompanyTitlePairs.has(normalizedCompanyTitle)) {
    return "Matches an existing job by company and title.";
  }

  return null;
}

export function validateJobImportPreview(options: {
  existingJobs: Array<{ company: string; title: string; url: string | null }>;
  mapping: JobImportColumnMapping;
  rows: Array<Record<string, string>>;
  columns: JobImportColumn[];
}) {
  const mappingErrors = getRequiredMappingErrors(options.mapping, options.columns);

  if (mappingErrors.length > 0) {
    return {
      formErrors: mappingErrors,
      importableJobs: [] as ImportableJobRecord[],
      preview: null as JobImportPreviewResult | null,
    };
  }

  const duplicateSignals = buildDuplicateSignals(options.existingJobs);
  const previewRows: JobImportPreviewRow[] = [];
  const importableJobs: ImportableJobRecord[] = [];
  let validRowCount = 0;
  let invalidRowCount = 0;
  let likelyDuplicateCount = 0;

  options.rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const fieldValues = normalizeMappedFieldValues(row, options.mapping);
    const errors: string[] = [];

    const company = fieldValues.company ?? "";
    const title = fieldValues.title ?? "";
    validateHumanReadableRequiredString(company, "Company", errors);
    validateHumanReadableRequiredString(title, "Job title", errors);

    let status: ImportableJobRecord["status"] = "SAVED";
    if (fieldValues.status) {
      const normalizedStatus = IMPORT_STATUS_MAP[normalizeLabel(fieldValues.status)];

      if (!normalizedStatus) {
        errors.push("Status must be one of Saved, Applied, Interviewing, Offer, Rejected, or Archived.");
      } else {
        status = normalizedStatus;
      }
    }

    let remoteType: ImportableJobRecord["remoteType"] | undefined;
    if (fieldValues.remoteType) {
      const normalizedRemoteType = IMPORT_REMOTE_TYPE_MAP[normalizeLabel(fieldValues.remoteType)];

      if (!normalizedRemoteType) {
        errors.push("Work mode must be Onsite, Hybrid, or Remote.");
      } else {
        remoteType = normalizedRemoteType;
      }
    }

    let employmentType: ImportableJobRecord["employmentType"] | undefined;
    if (fieldValues.employmentType) {
      const normalizedEmploymentType =
        IMPORT_EMPLOYMENT_TYPE_MAP[normalizeLabel(fieldValues.employmentType)];

      if (!normalizedEmploymentType) {
        errors.push(
          "Employment type must be Full-time, Part-time, Contract, Internship, or Temporary.",
        );
      } else {
        employmentType = normalizedEmploymentType;
      }
    }

    let url: string | undefined;
    if (fieldValues.url) {
      const urlResult = safeExternalUrlSchema.safeParse(fieldValues.url);

      if (!urlResult.success) {
        errors.push("Job URL must be a valid http:// or https:// URL.");
      } else {
        url = urlResult.data;
      }
    }

    let salaryMin: number | undefined;
    if (fieldValues.salaryMin) {
      const normalizedSalaryMin = parseImportInteger(fieldValues.salaryMin);

      if (normalizedSalaryMin === null) {
        errors.push("Salary min must be a non-negative whole number.");
      } else {
        salaryMin = normalizedSalaryMin;
      }
    }

    let salaryMax: number | undefined;
    if (fieldValues.salaryMax) {
      const normalizedSalaryMax = parseImportInteger(fieldValues.salaryMax);

      if (normalizedSalaryMax === null) {
        errors.push("Salary max must be a non-negative whole number.");
      } else {
        salaryMax = normalizedSalaryMax;
      }
    }

    if (
      salaryMin !== undefined &&
      salaryMax !== undefined &&
      salaryMin > salaryMax
    ) {
      errors.push("Salary min must be less than or equal to salary max.");
    }

    let deadline: Date | undefined;
    if (fieldValues.deadline) {
      const normalizedDeadline = parseImportDate(fieldValues.deadline);

      if (normalizedDeadline === undefined) {
        errors.push("Application deadline must use a supported date format.");
      } else if (normalizedDeadline !== null) {
        deadline = normalizedDeadline;
      }
    }

    let followUpAt: Date | undefined;
    if (fieldValues.followUpDate) {
      const normalizedFollowUpDate = parseImportDate(fieldValues.followUpDate);

      if (normalizedFollowUpDate === undefined) {
        errors.push("Follow-up date must use a supported date format.");
      } else if (normalizedFollowUpDate !== null) {
        followUpAt = normalizedFollowUpDate;
      }
    }

    if (errors.length > 0) {
      invalidRowCount += 1;
      previewRows.push({
        duplicateReason: null,
        errors,
        fieldValues,
        outcome: "invalid",
        rowNumber,
      });
      return;
    }

    const importableJob: ImportableJobRecord = {
      company,
      title,
      status,
      ...(fieldValues.location ? { location: fieldValues.location } : {}),
      ...(remoteType ? { remoteType } : {}),
      ...(employmentType ? { employmentType } : {}),
      ...(url ? { url } : {}),
      ...(fieldValues.source ? { source: fieldValues.source } : {}),
      ...(salaryMin !== undefined ? { salaryMin } : {}),
      ...(salaryMax !== undefined ? { salaryMax } : {}),
      ...(deadline ? { deadline } : {}),
      ...(followUpAt ? { followUpAt } : {}),
      ...(fieldValues.description ? { description: fieldValues.description } : {}),
    };

    const duplicateReason = detectDuplicateReason(importableJob, duplicateSignals);

    if (duplicateReason) {
      likelyDuplicateCount += 1;
      previewRows.push({
        duplicateReason,
        errors: [],
        fieldValues,
        outcome: "duplicate",
        rowNumber,
      });
      return;
    }

    validRowCount += 1;
    importableJobs.push(importableJob);
    previewRows.push({
      duplicateReason: null,
      errors: [],
      fieldValues,
      outcome: "valid",
      rowNumber,
    });
  });

  return {
    formErrors: [] as string[],
    importableJobs,
    preview: {
      invalidRowCount,
      likelyDuplicateCount,
      rows: previewRows,
      validRowCount,
    },
  };
}
