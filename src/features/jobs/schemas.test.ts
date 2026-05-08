import { describe, expect, it } from "vitest";

import {
  createJobSchema,
  updateJobStatusSchema,
} from "@/features/jobs/schemas";

describe("createJobSchema", () => {
  it("accepts valid input and converts optional blank strings to undefined", () => {
    const result = createJobSchema.parse({
      company: "  Acme Corp  ",
      title: "  Software Engineer  ",
      location: "   ",
      remoteType: undefined,
      employmentType: undefined,
      source: "",
      url: "   ",
      salaryMin: "",
      salaryMax: " ",
      salaryCurrency: "   ",
      description: "\t",
      deadline: "",
    });

    expect(result).toMatchObject({
      company: "Acme Corp",
      title: "Software Engineer",
      location: undefined,
      source: undefined,
      url: undefined,
      salaryMin: undefined,
      salaryMax: undefined,
      salaryCurrency: undefined,
      description: undefined,
      deadline: undefined,
    });
  });

  it("parses numeric salary fields and deadline dates correctly", () => {
    const result = createJobSchema.parse({
      company: "Acme",
      title: "Backend Engineer",
      location: "Remote",
      remoteType: "REMOTE",
      employmentType: "FULL_TIME",
      source: "LinkedIn",
      url: "https://example.com/jobs/123",
      salaryMin: "90000",
      salaryMax: "120000",
      salaryCurrency: "USD",
      description: "Strong backend role",
      deadline: "2026-05-20",
    });

    expect(result.salaryMin).toBe(90_000);
    expect(result.salaryMax).toBe(120_000);
    expect(result.deadline?.toISOString()).toBe("2026-05-20T00:00:00.000Z");
  });

  it("rejects company and title values that contain no letters", () => {
    const result = createJobSchema.safeParse({
      company: "12345",
      title: "!!!",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.flatten().fieldErrors.company).toContain(
      "Company must include at least one letter.",
    );
    expect(result.error.flatten().fieldErrors.title).toContain(
      "Job title must include at least one letter.",
    );
  });

  it("rejects invalid or unsafe URLs and salaryMin greater than salaryMax", () => {
    const result = createJobSchema.safeParse({
      company: "Acme",
      title: "Platform Engineer",
      url: "javascript:alert(1)",
      salaryMin: "150000",
      salaryMax: "100000",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.flatten().fieldErrors.url).toContain(
      "Enter a valid http:// or https:// URL.",
    );
    expect(result.error.flatten().fieldErrors.salaryMax).toContain(
      "Minimum salary must be less than or equal to maximum salary.",
    );
  });

  it("rejects malformed URLs", () => {
    const result = createJobSchema.safeParse({
      company: "Acme",
      title: "Platform Engineer",
      url: "not-a-url",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.flatten().fieldErrors.url).toContain("Enter a valid URL.");
  });
});

describe("updateJobStatusSchema", () => {
  it("accepts only supported statuses", () => {
    expect(
      updateJobStatusSchema.safeParse({
        jobId: "job_123",
        status: "APPLIED",
      }).success,
    ).toBe(true);

    expect(
      updateJobStatusSchema.safeParse({
        jobId: "job_123",
        status: "PENDING",
      }).success,
    ).toBe(false);
  });
});
