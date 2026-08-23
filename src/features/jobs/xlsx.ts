import ExcelJS from "exceljs";

import { sanitizeSpreadsheetCellText } from "@/features/jobs/spreadsheet-cell";
import { statusLabels, type JobStatus } from "@/features/jobs/status";

export type JobXlsxExportRow = {
  company: string;
  title: string;
  status: JobStatus;
  location: string | null;
  remoteType: string | null;
  employmentType: string | null;
  url: string | null;
  source: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  deadline: Date | null;
  followUpDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  notesCount: number;
  hasJobAnalysis: boolean;
};

const HEADER_ROW = [
  "Company",
  "Title",
  "Status",
  "Location",
  "Remote Type",
  "Employment Type",
  "Job URL",
  "Source",
  "Salary Range",
  "Deadline",
  "Follow-up Date",
  "Created Date",
  "Updated Date",
  "Notes Count",
  "AI Analysis",
] as const;

function formatSalaryRange(
  salaryMin: number | null,
  salaryMax: number | null,
  salaryCurrency: string | null,
) {
  if (salaryMin === null && salaryMax === null) {
    return "";
  }

  const currencyPrefix = sanitizeSpreadsheetCellText(salaryCurrency);
  const minLabel = salaryMin === null ? "" : String(salaryMin);
  const maxLabel = salaryMax === null ? "" : String(salaryMax);

  if (minLabel && maxLabel) {
    return `${currencyPrefix} ${minLabel}-${maxLabel}`.trim();
  }

  return `${currencyPrefix} ${minLabel || maxLabel}`.trim();
}

export function buildJobsXlsxRow(row: JobXlsxExportRow) {
  return [
    sanitizeSpreadsheetCellText(row.company),
    sanitizeSpreadsheetCellText(row.title),
    sanitizeSpreadsheetCellText(statusLabels[row.status] ?? row.status),
    sanitizeSpreadsheetCellText(row.location),
    sanitizeSpreadsheetCellText(row.remoteType),
    sanitizeSpreadsheetCellText(row.employmentType),
    sanitizeSpreadsheetCellText(row.url),
    sanitizeSpreadsheetCellText(row.source),
    formatSalaryRange(row.salaryMin, row.salaryMax, row.salaryCurrency),
    row.deadline,
    row.followUpDate,
    row.createdAt,
    row.updatedAt,
    row.notesCount,
    row.hasJobAnalysis ? "Ready" : "Not generated",
  ];
}

export async function buildJobsXlsx(rows: JobXlsxExportRow[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Jobs");

  worksheet.addRow(HEADER_ROW);
  for (const row of rows) {
    worksheet.addRow(buildJobsXlsxRow(row));
  }

  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: HEADER_ROW.length },
  };

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle" };

  worksheet.columns = [
    { width: 24 },
    { width: 28 },
    { width: 14 },
    { width: 22 },
    { width: 15 },
    { width: 18 },
    { width: 46 },
    { width: 18 },
    { width: 22 },
    { width: 14 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 12 },
    { width: 14 },
  ];

  const dateColumnNumbers = [10, 11, 12, 13];
  for (const columnNumber of dateColumnNumbers) {
    const column = worksheet.getColumn(columnNumber);
    column.numFmt = "yyyy-mm-dd";
  }

  const wrapColumnNumbers = [2, 7];
  for (const columnNumber of wrapColumnNumbers) {
    const column = worksheet.getColumn(columnNumber);
    column.alignment = { wrapText: true, vertical: "top" };
  }

  return workbook.xlsx.writeBuffer();
}
