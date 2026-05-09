import {
  buildJobImportColumns,
  JOB_IMPORT_MAX_FILE_BYTES,
  JOB_IMPORT_MAX_ROWS,
  type JobImportColumn,
} from "@/features/jobs/import-mapping";

export type ParsedJobImportCsv = {
  columns: JobImportColumn[];
  csvText: string;
  rows: Array<Record<string, string>>;
};

function parseCsvRows(csvText: string) {
  const rows: string[][] = [];
  let currentField = "";
  let currentRow: string[] = [];
  let insideQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];
    const nextCharacter = csvText[index + 1];

    if (insideQuotes) {
      if (character === '"' && nextCharacter === '"') {
        currentField += '"';
        index += 1;
        continue;
      }

      if (character === '"') {
        insideQuotes = false;
        continue;
      }

      currentField += character;
      continue;
    }

    if (character === '"') {
      insideQuotes = true;
      continue;
    }

    if (character === ",") {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if (character === "\r" && nextCharacter === "\n") {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentField = "";
      currentRow = [];
      index += 1;
      continue;
    }

    if (character === "\n" || character === "\r") {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentField = "";
      currentRow = [];
      continue;
    }

    currentField += character;
  }

  currentRow.push(currentField);
  rows.push(currentRow);

  if (insideQuotes) {
    throw new Error("The CSV file contains an unclosed quoted field.");
  }

  return rows;
}

function normalizeCsvText(csvText: string) {
  return csvText.replace(/^\uFEFF/, "");
}

function isEmptyRow(row: string[]) {
  return row.every((value) => value.trim().length === 0);
}

export async function parseJobImportCsvFile(file: File): Promise<ParsedJobImportCsv> {
  if (file.size === 0) {
    throw new Error("Choose a CSV file with at least one header row.");
  }

  if (file.size > JOB_IMPORT_MAX_FILE_BYTES) {
    throw new Error("CSV files must be 2 MB or smaller.");
  }

  const csvText = normalizeCsvText(await file.text());
  const parsedRows = parseCsvRows(csvText);
  const nonEmptyRows = parsedRows.filter((row, index) => index === 0 || !isEmptyRow(row));

  if (nonEmptyRows.length === 0) {
    throw new Error("Choose a CSV file with at least one header row.");
  }

  const [headerRow, ...dataRows] = nonEmptyRows;

  if (headerRow.every((value) => value.trim().length === 0)) {
    throw new Error("The CSV header row cannot be empty.");
  }

  if (dataRows.length > JOB_IMPORT_MAX_ROWS) {
    throw new Error(`CSV imports are limited to ${JOB_IMPORT_MAX_ROWS} rows.`);
  }

  const columns = buildJobImportColumns(headerRow);
  const rows = dataRows.map((row) => {
    const normalizedRow: Record<string, string> = {};

    columns.forEach((column, index) => {
      normalizedRow[column.key] = row[index] ?? "";
    });

    return normalizedRow;
  });

  return {
    columns,
    csvText,
    rows,
  };
}

export function parseJobImportCsvText(csvText: string): ParsedJobImportCsv {
  const normalizedCsvText = normalizeCsvText(csvText);
  const parsedRows = parseCsvRows(normalizedCsvText);
  const nonEmptyRows = parsedRows.filter((row, index) => index === 0 || !isEmptyRow(row));

  if (nonEmptyRows.length === 0) {
    throw new Error("Choose a CSV file with at least one header row.");
  }

  const [headerRow, ...dataRows] = nonEmptyRows;

  if (headerRow.every((value) => value.trim().length === 0)) {
    throw new Error("The CSV header row cannot be empty.");
  }

  if (dataRows.length > JOB_IMPORT_MAX_ROWS) {
    throw new Error(`CSV imports are limited to ${JOB_IMPORT_MAX_ROWS} rows.`);
  }

  const columns = buildJobImportColumns(headerRow);
  const rows = dataRows.map((row) => {
    const normalizedRow: Record<string, string> = {};

    columns.forEach((column, index) => {
      normalizedRow[column.key] = row[index] ?? "";
    });

    return normalizedRow;
  });

  return {
    columns,
    csvText: normalizedCsvText,
    rows,
  };
}

