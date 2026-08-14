import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteMany: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
  revalidatePath: vi.fn(),
  requireUser: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/features/auth/require-user", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/server/db/prisma", () => ({
  prisma: {
    job: { findFirst: mocks.findFirst },
    jobContact: {
      create: mocks.create,
      deleteMany: mocks.deleteMany,
      updateMany: mocks.updateMany,
    },
  },
}));

import {
  createJobContact,
  deleteJobContact,
  updateJobContact,
  updateOutreachStatus,
} from "@/features/contacts/actions";

function contactFormData(overrides: Record<string, string> = {}) {
  const values = {
    jobId: "job_owned",
    name: "Casey Lee",
    title: "Engineering Manager",
    company: "Acme",
    profileUrl: "https://example.com/casey",
    email: "casey@example.com",
    contactType: "HIRING_MANAGER",
    relevanceNotes: "Likely team lead.",
    outreachStatus: "NOT_CONTACTED",
    lastContactedAt: "",
    followUpAt: "2026-08-17",
    notes: "",
    ...overrides,
  };
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

describe("job contact actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({ id: "user_one" });
  });

  it("creates a contact only after the authenticated user owns the job", async () => {
    mocks.findFirst.mockResolvedValue({ id: "job_owned" });
    mocks.create.mockResolvedValue({ id: "contact_1" });

    await expect(createJobContact({}, contactFormData())).resolves.toEqual({});

    expect(mocks.findFirst).toHaveBeenCalledWith({ where: { id: "job_owned", userId: "user_one" }, select: { id: true } });
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ jobId: "job_owned", userId: "user_one", followUpAt: new Date("2026-08-17T00:00:00.000Z") }),
    }));
  });

  it("scopes edit, status, and delete mutations through both the user and related job", async () => {
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.deleteMany.mockResolvedValue({ count: 1 });

    await expect(updateJobContact({}, contactFormData({ contactId: "contact_1", name: "Updated Casey" }))).resolves.toEqual({});
    await expect(updateOutreachStatus({}, contactFormData({ contactId: "contact_1", outreachStatus: "RESPONDED" }))).resolves.toEqual({});
    await expect(deleteJobContact({}, contactFormData({ contactId: "contact_1" }))).resolves.toEqual({});

    const expectedScope = { id: "contact_1", jobId: "job_owned", userId: "user_one", job: { userId: "user_one" } };
    expect(mocks.updateMany).toHaveBeenNthCalledWith(1, expect.objectContaining({ where: expectedScope, data: expect.objectContaining({ name: "Updated Casey" }) }));
    expect(mocks.updateMany).toHaveBeenNthCalledWith(2, expect.objectContaining({ where: expectedScope, data: { outreachStatus: "RESPONDED" } }));
    expect(mocks.deleteMany).toHaveBeenCalledWith({ where: expectedScope });
  });

  it("does not report another user's contact as editable or deletable", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    mocks.deleteMany.mockResolvedValue({ count: 0 });

    await expect(updateJobContact({}, contactFormData({ contactId: "contact_other" }))).resolves.toEqual({ formError: "This contact could not be found." });
    await expect(deleteJobContact({}, contactFormData({ contactId: "contact_other" }))).resolves.toEqual({ formError: "This contact could not be found." });

    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: "contact_other", userId: "user_one", job: { userId: "user_one" } }) }));
    expect(mocks.deleteMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: "contact_other", userId: "user_one", job: { userId: "user_one" } }) }));
  });
});
