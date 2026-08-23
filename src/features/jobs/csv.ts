import { sanitizeSpreadsheetCellText } from "@/features/jobs/spreadsheet-cell";

type JobExportRow = {
  company: string;
  title: string;
  status: string;
  location: string | null;
  remoteType: string | null;
  employmentType: string | null;
  url: string | null;
  source: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  deadline: Date | null;
  followUpDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  notesCount: number;
};

const JOB_EXPORT_HEADERS = [
  "company",
  "title",
  "status",
  "location",
  "remoteType",
  "employmentType",
  "url",
  "source",
  "salaryMin",
  "salaryMax",
  "deadline",
  "followUpDate",
  "createdAt",
  "updatedAt",
  "notesCount",
] as const;

function formatCsvScalar(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = typeof value === "string" ? sanitizeSpreadsheetCellText(value) : String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function formatDateForCsv(value: Date | null) {
  return value ? value.toISOString() : "";
}

export function buildJobsCsv(rows: JobExportRow[]) {
  const headerLine = JOB_EXPORT_HEADERS.join(",");

  const dataLines = rows.map((row) =>
    [
      row.company,
      row.title,
      row.status,
      row.location,
      row.remoteType,
      row.employmentType,
      row.url,
      row.source,
      row.salaryMin,
      row.salaryMax,
      formatDateForCsv(row.deadline),
      formatDateForCsv(row.followUpDate),
      row.createdAt.toISOString(),
      row.updatedAt.toISOString(),
      row.notesCount,
    ]
      .map((value) => formatCsvScalar(value))
      .join(","),
  );

  return [headerLine, ...dataLines].join("\n");
}
