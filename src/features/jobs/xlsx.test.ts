import { describe, expect, it } from "vitest";

import { buildJobsXlsxRow } from "@/features/jobs/xlsx";

describe("buildJobsXlsxRow", () => {
  it("sanitizes spreadsheet formula prefixes in user-controlled text", () => {
    const row = buildJobsXlsxRow({
      company: "=HYPERLINK(\"https://example.com\")",
      title: "+cmd",
      status: "SAVED",
      location: "-unsafe",
      remoteType: "@remote",
      employmentType: "FULL_TIME",
      url: "https://example.com",
      source: "LinkedIn",
      salaryMin: 100000,
      salaryMax: 150000,
      salaryCurrency: "USD",
      deadline: null,
      followUpDate: null,
      createdAt: new Date("2026-05-01T00:00:00.000Z"),
      updatedAt: new Date("2026-05-01T00:00:00.000Z"),
      notesCount: 0,
      hasJobAnalysis: false,
    });

    expect(row[0]).toBe("'=HYPERLINK(\"https://example.com\")");
    expect(row[1]).toBe("'+cmd");
    expect(row[3]).toBe("'-unsafe");
    expect(row[4]).toBe("'@remote");
  });

  it("uses the shared sanitizer for leading whitespace and control-character formula prefixes", () => {
    const row = buildJobsXlsxRow({
      company: " \t=SUM(A1:A2)",
      title: "\u0000@cmd",
      status: "SAVED",
      location: null,
      remoteType: null,
      employmentType: null,
      url: null,
      source: null,
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      deadline: null,
      followUpDate: null,
      createdAt: new Date("2026-05-01T00:00:00.000Z"),
      updatedAt: new Date("2026-05-01T00:00:00.000Z"),
      notesCount: 0,
      hasJobAnalysis: false,
    });

    expect(row[0]).toBe("'=SUM(A1:A2)");
    expect(row[1]).toBe("'\u0000@cmd");
  });

  it("formats salary ranges and AI analysis status", () => {
    const row = buildJobsXlsxRow({
      company: "ACME",
      title: "Frontend Engineer",
      status: "APPLIED",
      location: "NYC",
      remoteType: "REMOTE",
      employmentType: "FULL_TIME",
      url: "https://example.com/job",
      source: "Referral",
      salaryMin: 120000,
      salaryMax: 150000,
      salaryCurrency: "USD",
      deadline: null,
      followUpDate: null,
      createdAt: new Date("2026-05-01T00:00:00.000Z"),
      updatedAt: new Date("2026-05-01T00:00:00.000Z"),
      notesCount: 2,
      hasJobAnalysis: true,
    });

    expect(row[2]).toBe("Applied");
    expect(row[8]).toBe("USD 120000-150000");
    expect(row[14]).toBe("Ready");
  });
});
