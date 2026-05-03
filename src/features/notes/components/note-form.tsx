"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createNote, type CreateNoteActionState } from "@/features/notes/actions";

type NoteFormProps = {
  jobId: string;
};

const initialState: CreateNoteActionState = {};

export function NoteForm({ jobId }: NoteFormProps) {
  const [state, formAction, isPending] = useActionState(
    createNote,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="jobId" value={jobId} />
      <div>
        <label htmlFor="body" className="text-sm font-medium text-slate-950">
          Add note
        </label>
        <Textarea
          id="body"
          name="body"
          placeholder="Add interview notes, recruiter updates, follow-up reminders, or decision context."
        />
        {state.fieldErrors?.body?.[0] ? (
          <p className="mt-1 text-sm text-red-600">
            {state.fieldErrors.body[0]}
          </p>
        ) : null}
      </div>
      {state.formError ? (
        <p className="text-sm text-red-600">{state.formError}</p>
      ) : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding..." : "Add note"}
      </Button>
    </form>
  );
}
