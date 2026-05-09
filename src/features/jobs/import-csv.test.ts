import { describe, expect, it } from "vitest";

import { parseJobImportCsvText } from "@/features/jobs/import-csv";

describe("parseJobImportCsvText", () => {
  it("parses CRLF line endings", () => {
    const parsed = parseJobImportCsvText("company,title\r\nAcme,Engineer\r\n");

    expect(parsed.rows).toEqual([
      {
        col_0: "Acme",
        col_1: "Engineer",
      },
    ]);
  });

  it("parses quoted commas, quotes, and newlines", () => {
    const parsed = parseJobImportCsvText(
      [
        "company,title,description",
        '"ACME, Inc.","Senior ""Full Stack"" Developer","Line one',
        'Line two"',
      ].join("\n"),
    );

    expect(parsed.columns.map((column) => column.label)).toEqual([
      "company",
      "title",
      "description",
    ]);
    expect(parsed.rows).toEqual([
      {
        col_0: "ACME, Inc.",
        col_1: 'Senior "Full Stack" Developer',
        col_2: "Line one\nLine two",
      },
    ]);
  });

  it("rejects csv files with too many rows", () => {
    const csvText = [
      "company,title",
      ...Array.from({ length: 501 }, (_, index) => `Company ${index},Role ${index}`),
    ].join("\n");

    expect(() => parseJobImportCsvText(csvText)).toThrow(
      "CSV imports are limited to 500 rows.",
    );
  });

  it("rejects csv text above 2 MB", () => {
    const oversizedCompanyName = "A".repeat(2 * 1024 * 1024 + 1);
    const csvText = `company,title\n${oversizedCompanyName},Engineer`;

    expect(() => parseJobImportCsvText(csvText)).toThrow(
      "CSV files must be 2 MB or smaller.",
    );
  });
});
