"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/features/auth/require-user";
import { createNoteSchema, deleteNoteSchema } from "@/features/notes/schemas";
import { prisma } from "@/server/db/prisma";

export type CreateNoteActionState = {
  fieldErrors?: {
    body?: string[];
  };
  formError?: string;
};

export async function createNote(
  _previousState: CreateNoteActionState,
  formData: FormData,
): Promise<CreateNoteActionState> {
  const user = await requireUser();

  const parsedInput = createNoteSchema.safeParse({
    jobId: formData.get("jobId"),
    body: formData.get("body"),
  });

  if (!parsedInput.success) {
    return {
      fieldErrors: parsedInput.error.flatten().fieldErrors,
    };
  }

  const job = await prisma.job.findFirst({
    where: {
      id: parsedInput.data.jobId,
      userId: user.id,
    },
    select: {
      id: true,
    },
  });

  if (!job) {
    return {
      formError: "This job could not be found.",
    };
  }

  await prisma.note.create({
    data: {
      jobId: job.id,
      userId: user.id,
      body: parsedInput.data.body,
    },
  });

  revalidatePath(`/jobs/${job.id}`);

  return {};
}

export type DeleteNoteActionState = {
  formError?: string;
};

export async function deleteNote(
  _previousState: DeleteNoteActionState,
  formData: FormData,
): Promise<DeleteNoteActionState> {
  const user = await requireUser();

  const parsedInput = deleteNoteSchema.safeParse({
    jobId: formData.get("jobId"),
    noteId: formData.get("noteId"),
  });

  if (!parsedInput.success) {
    return {
      formError: "This note could not be deleted.",
    };
  }

  const deleteResult = await prisma.note.deleteMany({
    where: {
      id: parsedInput.data.noteId,
      jobId: parsedInput.data.jobId,
      userId: user.id,
      job: {
        userId: user.id,
      },
    },
  });

  if (deleteResult.count === 0) {
    return {
      formError: "This note could not be found.",
    };
  }

  revalidatePath(`/jobs/${parsedInput.data.jobId}`);

  return {};
}
