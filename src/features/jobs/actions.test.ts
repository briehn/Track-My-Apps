import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteMany: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
  requireUser: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/features/auth/require-user", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/features/jobs/job-persistence", () => ({ createJobForUser: vi.fn() }));
vi.mock("@/server/db/prisma", () => ({
  prisma: {
    job: {
      deleteMany: mocks.deleteMany,
    },
  },
}));

import { deleteJob } from "@/features/jobs/actions";

function deleteFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("jobId", "job_owned");
  formData.set("confirmDelete", "on");

  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }

  return formData;
}

describe("deleteJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({ id: "user_one" });
  });

  it("keeps server-side confirmation enforced before a delete query runs", async () => {
    const formData = deleteFormData();
    formData.delete("confirmDelete");

    await expect(deleteJob({}, formData)).resolves.toEqual({
      formError: "Confirm permanent deletion before deleting this job.",
    });

    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("deletes only within the authenticated user's scope after confirmation", async () => {
    mocks.deleteMany.mockResolvedValue({ count: 1 });

    await expect(deleteJob({}, deleteFormData())).resolves.toBeUndefined();

    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: {
        id: "job_owned",
        userId: "user_one",
      },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/jobs");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/jobs/job_owned");
    expect(mocks.redirect).toHaveBeenCalledWith("/jobs");
  });

  it("returns a safe failure when the authenticated user does not own the job", async () => {
    mocks.deleteMany.mockResolvedValue({ count: 0 });

    await expect(deleteJob({}, deleteFormData())).resolves.toEqual({
      formError: "This job could not be found.",
    });

    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: {
        id: "job_owned",
        userId: "user_one",
      },
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
