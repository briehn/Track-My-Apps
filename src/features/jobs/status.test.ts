import { describe, expect, it } from "vitest";

import {
  APPLICATION_STATUSES,
  applicationStatusOptions,
  isApplicationStatus,
  statusBadgeVariants,
  statusLabels,
} from "@/features/jobs/status";

describe("isApplicationStatus", () => {
  it("accepts supported statuses and rejects unsupported values", () => {
    expect(isApplicationStatus("SAVED")).toBe(true);
    expect(isApplicationStatus("ARCHIVED")).toBe(true);
    expect(isApplicationStatus("PENDING")).toBe(false);
    expect(isApplicationStatus("")).toBe(false);
  });
});

describe("status metadata", () => {
  it("covers every application status with a label", () => {
    expect(Object.keys(statusLabels).sort()).toEqual([...APPLICATION_STATUSES].sort());
  });

  it("covers every application status with a badge variant", () => {
    expect(Object.keys(statusBadgeVariants).sort()).toEqual(
      [...APPLICATION_STATUSES].sort(),
    );
  });

  it("provides menu options from the same canonical status set", () => {
    expect(applicationStatusOptions.map(({ value }) => value)).toEqual(
      APPLICATION_STATUSES,
    );
  });
});
