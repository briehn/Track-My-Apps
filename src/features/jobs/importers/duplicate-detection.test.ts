import { describe, expect, it } from "vitest";

import {
  findJobDraftDuplicate,
  findJobImportDuplicateForUser,
} from "@/features/jobs/importers/duplicate-detection";

describe("findJobDraftDuplicate", () => {
  const existingJobs = [
    {
      company: "Acme Labs",
      id: "job_existing",
      title: "Senior Product Engineer",
      url: "https://boards.greenhouse.io/acmelabs/jobs/44444?gh_src=career_site#apply",
    },
  ];

  it("warns when canonical job URLs match", () => {
    expect(
      findJobDraftDuplicate(
        {
          company: "Different Company",
          title: "Different Title",
          url: "https://boards.greenhouse.io/acmelabs/jobs/44444?gh_src=career_site",
        },
        existingJobs,
      ),
    ).toEqual({ jobId: "job_existing", reason: "URL" });
  });

  it("uses company and title only when the imported draft has no usable URL", () => {
    expect(
      findJobDraftDuplicate(
        {
          company: "ACME labs",
          title: "Senior Product Engineer",
        },
        existingJobs,
      ),
    ).toEqual({ jobId: "job_existing", reason: "COMPANY_TITLE" });
  });

  it("does not warn for unrelated jobs", () => {
    expect(
      findJobDraftDuplicate(
        {
          company: "Beta Corp",
          title: "Designer",
          url: "https://boards.greenhouse.io/beta/jobs/99999",
        },
        existingJobs,
      ),
    ).toBeUndefined();
  });
});

describe("findJobImportDuplicateForUser", () => {
  it("queries duplicate candidates only for the current user", async () => {
    const queriedUserIds: string[] = [];

    await findJobImportDuplicateForUser(
      "current_user",
      {
        company: "Acme",
        title: "Engineer",
      },
      async (userId) => {
        queriedUserIds.push(userId);
        return [];
      },
    );

    expect(queriedUserIds).toEqual(["current_user"]);
  });
});
