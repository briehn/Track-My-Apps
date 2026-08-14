import { describe, expect, it } from "vitest";

import {
  createJobContactSchema,
  deleteJobContactSchema,
  updateJobContactSchema,
  updateOutreachStatusSchema,
} from "@/features/contacts/schemas";

const validContact = {
  jobId: "job_123",
  name: "  Casey Lee ",
  title: " Engineering Manager ",
  company: " Acme ",
  profileUrl: " https://example.com/casey ",
  email: " casey@example.com ",
  contactType: "HIRING_MANAGER",
  relevanceNotes: "Works on the likely team.",
  outreachStatus: "FOLLOW_UP_NEEDED",
  lastContactedAt: "2026-08-10",
  followUpAt: "2026-08-17",
  notes: "Asked for an informational conversation.",
};

describe("job contact schemas", () => {
  it("accepts and normalizes manual contact creation including follow-up dates", () => {
    const contact = createJobContactSchema.parse(validContact);

    expect(contact).toMatchObject({
      name: "Casey Lee",
      title: "Engineering Manager",
      company: "Acme",
      profileUrl: "https://example.com/casey",
      email: "casey@example.com",
      contactType: "HIRING_MANAGER",
      outreachStatus: "FOLLOW_UP_NEEDED",
    });
    expect(contact.followUpAt?.toISOString()).toBe("2026-08-17T00:00:00.000Z");
  });

  it("validates contact types, outreach statuses, and safe profile URLs", () => {
    expect(createJobContactSchema.safeParse({ ...validContact, contactType: "REFERRER" }).success).toBe(false);
    expect(createJobContactSchema.safeParse({ ...validContact, outreachStatus: "PENDING" }).success).toBe(false);
    expect(createJobContactSchema.safeParse({ ...validContact, profileUrl: "javascript:alert(1)" }).success).toBe(false);
  });

  it("keeps edit and delete requests tied to a job and specific contact", () => {
    expect(updateJobContactSchema.safeParse({ ...validContact, contactId: "contact_123", name: "Updated Casey" }).success).toBe(true);
    expect(deleteJobContactSchema.safeParse({ jobId: "job_123", contactId: "contact_123" }).success).toBe(true);
    expect(updateOutreachStatusSchema.safeParse({ jobId: "job_123", contactId: "contact_123", outreachStatus: "RESPONDED" }).success).toBe(true);
  });
});
