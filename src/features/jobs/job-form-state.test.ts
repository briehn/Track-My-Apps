import { describe, expect, it } from "vitest";

import {
  getFirstInvalidJobFormField,
  mergeImportedJobDraft,
  toJobFormValues,
} from "@/features/jobs/job-form-state";

describe("getFirstInvalidJobFormField", () => {
  it("returns the first invalid field in form order", () => {
    expect(
      getFirstInvalidJobFormField({
        description: ["Description is too long"],
        title: ["Job title is required"],
      }),
    ).toBe("title");
  });

  it("returns undefined when there are no field errors", () => {
    expect(getFirstInvalidJobFormField()).toBeUndefined();
  });
});

describe("toJobFormValues", () => {
  it("converts imported dates and numbers into existing form control values", () => {
    expect(
      toJobFormValues({
        company: "Acme",
        deadline: new Date("2026-09-01T23:59:59.000Z"),
        remoteType: "REMOTE",
        salaryMax: 150_000,
        salaryMin: 100_000,
        title: "Engineer",
      }),
    ).toMatchObject({
      company: "Acme",
      deadline: "2026-09-01",
      remoteType: "REMOTE",
      salaryMax: "150000",
      salaryMin: "100000",
      title: "Engineer",
    });
  });
});

describe("mergeImportedJobDraft", () => {
  it("fills blank fields from an imported draft", () => {
    expect(
      mergeImportedJobDraft(
        {},
        {
          company: "Acme",
          location: "New York, NY",
          title: "Engineer",
          url: "https://example.com/jobs/42",
        },
      ),
    ).toMatchObject({
      company: "Acme",
      location: "New York, NY",
      title: "Engineer",
      url: "https://example.com/jobs/42",
    });
  });

  it("preserves meaningful user-entered values and handles missing optional imported fields", () => {
    const currentValues = {
      company: "My Company Name",
      description: "My notes",
      location: "",
      title: "My Title",
    };

    expect(
      mergeImportedJobDraft(currentValues, {
        company: "Acme",
        location: "New York, NY",
        title: "Engineer",
      }),
    ).toEqual({
      company: "My Company Name",
      description: "My notes",
      location: "New York, NY",
      title: "My Title",
    });
  });
});
