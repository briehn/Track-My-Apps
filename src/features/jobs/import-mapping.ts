export const JOB_IMPORT_MAX_FILE_BYTES = 2 * 1024 * 1024;
export const JOB_IMPORT_MAX_ROWS = 500;

export const JOB_IMPORT_FIELDS = [
  { field: "company", label: "Company", required: true },
  { field: "title", label: "Job title", required: true },
  { field: "status", label: "Status", required: false },
  { field: "location", label: "Location", required: false },
  { field: "remoteType", label: "Work mode", required: false },
  { field: "employmentType", label: "Employment type", required: false },
  { field: "url", label: "Job URL", required: false },
  { field: "source", label: "Source", required: false },
  { field: "salaryMin", label: "Salary min", required: false },
  { field: "salaryMax", label: "Salary max", required: false },
  { field: "deadline", label: "Application deadline", required: false },
  { field: "followUpDate", label: "Follow-up date", required: false },
  { field: "description", label: "Description", required: false },
] as const;

export type JobImportField = (typeof JOB_IMPORT_FIELDS)[number]["field"];

export type JobImportColumn = {
  key: string;
  label: string;
};

export type JobImportColumnMapping = Partial<Record<JobImportField, string>>;

const HEADER_ALIASES: Record<string, JobImportField> = {
  company: "company",
  "company name": "company",
  employer: "company",
  title: "title",
  "job title": "title",
  position: "title",
  role: "title",
  status: "status",
  "job status": "status",
  "application status": "status",
  location: "location",
  city: "location",
  "work mode": "remoteType",
  "remote type": "remoteType",
  remote: "remoteType",
  "employment type": "employmentType",
  "job type": "employmentType",
  type: "employmentType",
  url: "url",
  link: "url",
  "job url": "url",
  "posting url": "url",
  source: "source",
  "salary min": "salaryMin",
  "minimum salary": "salaryMin",
  "salary minimum": "salaryMin",
  "salary max": "salaryMax",
  "maximum salary": "salaryMax",
  "salary maximum": "salaryMax",
  deadline: "deadline",
  "application deadline": "deadline",
  "follow up": "followUpDate",
  "follow up date": "followUpDate",
  "follow-up": "followUpDate",
  "follow-up date": "followUpDate",
  description: "description",
  "job description": "description",
  details: "description",
};

function normalizeHeaderLabel(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function buildJobImportColumns(headers: string[]) {
  return headers.map((header, index) => ({
    key: `col_${index}`,
    label: header.trim() || `Column ${index + 1}`,
  }));
}

export function suggestJobImportColumnMapping(
  columns: JobImportColumn[],
): JobImportColumnMapping {
  const mapping: JobImportColumnMapping = {};
  const usedColumnKeys = new Set<string>();

  for (const column of columns) {
    const normalizedHeader = normalizeHeaderLabel(column.label);
    const field = HEADER_ALIASES[normalizedHeader];

    if (!field || usedColumnKeys.has(column.key) || mapping[field]) {
      continue;
    }

    mapping[field] = column.key;
    usedColumnKeys.add(column.key);
  }

  return mapping;
}

export function parseJobImportColumnMappingFromFormData(formData: FormData) {
  const mapping: JobImportColumnMapping = {};

  for (const { field } of JOB_IMPORT_FIELDS) {
    const selectedColumnKey = formData.get(`mapping:${field}`);

    if (typeof selectedColumnKey !== "string" || !selectedColumnKey) {
      continue;
    }

    mapping[field] = selectedColumnKey;
  }

  return mapping;
}

