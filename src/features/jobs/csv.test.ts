import { describe, expect, it } from "vitest";

import { buildJobsCsv } from "@/features/jobs/csv";

describe("buildJobsCsv", () => {
  it("builds a header-only csv for empty input", () => {
    const csv = buildJobsCsv([]);

    expect(csv).toBe(
      "company,title,status,location,remoteType,employmentType,url,source,salaryMin,salaryMax,deadline,followUpDate,createdAt,updatedAt,notesCount",
    );
  });

  it("escapes commas, quotes, and newlines", () => {
    const csv = buildJobsCsv([
      {
        company: 'ACME, "Corp"',
        title: "Frontend\nEngineer",
        status: "SAVED",
        location: "New York, NY",
        remoteType: "REMOTE",
        employmentType: "FULL_TIME",
        url: "https://example.com/job",
        source: "LinkedIn",
        salaryMin: 100000,
        salaryMax: 140000,
        deadline: new Date("2026-06-01T00:00:00.000Z"),
        followUpDate: null,
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-02T12:00:00.000Z"),
        notesCount: 2,
      },
    ]);

    expect(csv).toContain('"ACME, ""Corp"""');
    expect(csv).toContain('"Frontend\nEngineer"');
    expect(csv).toContain('"New York, NY"');
    expect(csv).toContain("2026-06-01T00:00:00.000Z");
  });
});

