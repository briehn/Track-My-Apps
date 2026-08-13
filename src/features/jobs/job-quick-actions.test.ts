import { describe, expect, it } from "vitest";

import { getJobQuickActions } from "@/features/jobs/job-quick-actions";

const baseJob = {
  id: "job_123",
  company: "Algolia",
  title: "Software Engineer",
  status: "APPLIED" as const,
  url: "https://jobs.example.com/roles/123",
};

describe("getJobQuickActions", () => {
  it("uses the canonical status set and marks the current status", () => {
    const actions = getJobQuickActions(baseJob);

    expect(actions.statusOptions.map(({ status }) => status)).toEqual([
      "SAVED",
      "APPLIED",
      "INTERVIEWING",
      "OFFER",
      "REJECTED",
      "ARCHIVED",
    ]);
    expect(actions.statusOptions.find(({ status }) => status === "APPLIED")).toEqual({
      status: "APPLIED",
      isCurrent: true,
    });
  });

  it("uses Archive for active jobs and Unarchive for archived jobs", () => {
    expect(getJobQuickActions(baseJob).archiveLabel).toBe("Archive");
    expect(
      getJobQuickActions({ ...baseJob, status: "ARCHIVED" }).archiveLabel,
    ).toBe("Unarchive");
  });

  it("only exposes safe job-posting URLs", () => {
    expect(getJobQuickActions({ ...baseJob, url: null }).jobPostingUrl).toBeUndefined();
    expect(
      getJobQuickActions({ ...baseJob, url: "javascript:alert(1)" }).jobPostingUrl,
    ).toBeUndefined();
    expect(getJobQuickActions(baseJob).jobPostingUrl).toBe(baseJob.url);
  });
});
