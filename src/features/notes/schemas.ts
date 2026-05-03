import { z } from "zod";

export const createNoteSchema = z.object({
  jobId: z.string().min(1, "Job is required."),
  body: z.string().trim().min(1, "Note cannot be empty."),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;

export const deleteNoteSchema = z.object({
  jobId: z.string().min(1, "Job is required."),
  noteId: z.string().min(1, "Note is required."),
});

export type DeleteNoteInput = z.infer<typeof deleteNoteSchema>;
