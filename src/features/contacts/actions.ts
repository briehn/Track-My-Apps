"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/features/auth/require-user";
import {
  createJobContactSchema,
  deleteJobContactSchema,
  updateJobContactSchema,
  updateOutreachStatusSchema,
} from "@/features/contacts/schemas";
import { getJobContactScope } from "@/features/contacts/queries";
import { prisma } from "@/server/db/prisma";

type ContactFieldErrors = Partial<
  Record<keyof typeof createJobContactSchema.shape, string[]>
>;

export type ContactActionState = {
  fieldErrors?: ContactFieldErrors;
  formError?: string;
};

function getContactFormInput(formData: FormData) {
  return {
    jobId: formData.get("jobId"),
    name: formData.get("name"),
    title: formData.get("title"),
    company: formData.get("company"),
    profileUrl: formData.get("profileUrl"),
    email: formData.get("email"),
    contactType: formData.get("contactType"),
    relevanceNotes: formData.get("relevanceNotes"),
    outreachStatus: formData.get("outreachStatus"),
    lastContactedAt: formData.get("lastContactedAt"),
    followUpAt: formData.get("followUpAt"),
    notes: formData.get("notes"),
  };
}

function revalidateJobContactPath(jobId: string) {
  revalidatePath(`/jobs/${jobId}`);
}

export async function createJobContact(
  _previousState: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const user = await requireUser();
  const parsedInput = createJobContactSchema.safeParse(getContactFormInput(formData));

  if (!parsedInput.success) {
    return { fieldErrors: parsedInput.error.flatten().fieldErrors };
  }

  const { jobId, ...contactData } = parsedInput.data;
  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: user.id },
    select: { id: true },
  });

  if (!job) {
    return { formError: "This job could not be found." };
  }

  await prisma.jobContact.create({
    data: { ...contactData, jobId: job.id, userId: user.id },
  });

  revalidateJobContactPath(job.id);
  return {};
}

export async function updateJobContact(
  _previousState: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const user = await requireUser();
  const parsedInput = updateJobContactSchema.safeParse({
    ...getContactFormInput(formData),
    contactId: formData.get("contactId"),
  });

  if (!parsedInput.success) {
    return { fieldErrors: parsedInput.error.flatten().fieldErrors };
  }

  const { contactId, jobId, ...contactData } = parsedInput.data;
  const updateResult = await prisma.jobContact.updateMany({
    where: { id: contactId, ...getJobContactScope(user.id, jobId) },
    data: contactData,
  });

  if (updateResult.count === 0) {
    return { formError: "This contact could not be found." };
  }

  revalidateJobContactPath(jobId);
  return {};
}

export async function deleteJobContact(
  _previousState: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const user = await requireUser();
  const parsedInput = deleteJobContactSchema.safeParse({
    jobId: formData.get("jobId"),
    contactId: formData.get("contactId"),
  });

  if (!parsedInput.success) {
    return { formError: "This contact could not be deleted." };
  }

  const deleteResult = await prisma.jobContact.deleteMany({
    where: { id: parsedInput.data.contactId, ...getJobContactScope(user.id, parsedInput.data.jobId) },
  });

  if (deleteResult.count === 0) {
    return { formError: "This contact could not be found." };
  }

  revalidateJobContactPath(parsedInput.data.jobId);
  return {};
}

export async function updateOutreachStatus(
  _previousState: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const user = await requireUser();
  const parsedInput = updateOutreachStatusSchema.safeParse({
    jobId: formData.get("jobId"),
    contactId: formData.get("contactId"),
    outreachStatus: formData.get("outreachStatus"),
  });

  if (!parsedInput.success) {
    return { formError: "Choose a valid outreach status." };
  }

  const updateResult = await prisma.jobContact.updateMany({
    where: {
      id: parsedInput.data.contactId,
      ...getJobContactScope(user.id, parsedInput.data.jobId),
    },
    data: { outreachStatus: parsedInput.data.outreachStatus },
  });

  if (updateResult.count === 0) {
    return { formError: "This contact could not be found." };
  }

  revalidateJobContactPath(parsedInput.data.jobId);
  return {};
}
