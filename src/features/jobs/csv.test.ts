import { describe, expect, it } from "vitest";

import { buildJobsCsv } from "@/features/jobs/csv";

function buildRow(overrides: Partial<Parameters<typeof buildJobsCsv>[0][number]> = {}) {
  return {
    company: "Acme",
    title: "Platform Engineer",
    status: "SAVED",
    location: null,
    remoteType: null,
    employmentType: null,
    url: null,
    source: null,
    salaryMin: 100000,
    salaryMax: 140000,
    deadline: null,
    followUpDate: null,
    createdAt: new Date("2026-05-01T12:00:00.000Z"),
    updatedAt: new Date("2026-05-02T12:00:00.000Z"),
    notesCount: 2,
    ...overrides,
  };
}

describe("buildJobsCsv", () => {
  it("builds a header-only csv for empty input", () => {
    const csv = buildJobsCsv([]);

    expect(csv).toBe(
      "company,title,status,location,remoteType,employmentType,url,source,salaryMin,salaryMax,deadline,followUpDate,createdAt,updatedAt,notesCount",
    );
  });

  it("escapes commas, quotes, and newlines", () => {
    const csv = buildJobsCsv([
      buildRow({
        company: 'ACME, "Corp"',
        title: "Frontend\nEngineer",
        deadline: new Date("2026-06-01T00:00:00.000Z"),
        employmentType: "FULL_TIME",
        location: "New York, NY",
        remoteType: "REMOTE",
        source: "LinkedIn",
        url: "https://example.com/job",
      }),
    ]);

    expect(csv).toContain('"ACME, ""Corp"""');
    expect(csv).toContain('"Frontend\nEngineer"');
    expect(csv).toContain('"New York, NY"');
    expect(csv).toContain("2026-06-01T00:00:00.000Z");
  });

  it.each([
    ["=HYPERLINK(\"https://example.com\")", "'=HYPERLINK(\"https://example.com\")"],
    ["+SUM(A1:A2)", "+SUM(A1:A2)".replace("+", "'+")],
    ["-1+1", "'-1+1"],
    ["@something", "'@something"],
  ])("neutralizes the spreadsheet formula prefix %s", (title, expectedTitle) => {
    const csv = buildJobsCsv([buildRow({ title })]);

    expect(csv).toContain(expectedTitle.replace(/"/g, '""'));
  });

  it("neutralizes formulas preceded by whitespace or control characters", () => {
    const csv = buildJobsCsv([
      buildRow({ company: " \t=SUM(A1:A2)", title: "\u0000@cmd" }),
    ]);

    expect(csv).toContain("'=SUM(A1:A2)");
    expect(csv).toContain("'\u0000@cmd");
  });

  it("keeps normal text and internally generated numeric values unchanged", () => {
    const csv = buildJobsCsv([buildRow({ company: "Acme, Inc.", title: "Senior Engineer" })]);

    expect(csv).toContain('"Acme, Inc."');
    expect(csv).toContain("Senior Engineer");
    expect(csv).toContain(",100000,140000,");
  });
});
