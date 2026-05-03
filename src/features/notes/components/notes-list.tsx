"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { deleteNote, type DeleteNoteActionState } from "@/features/notes/actions";
import type { JobNote } from "@/features/notes/queries";

type NotesListProps = {
  jobId: string;
  notes: JobNote[];
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function DeleteNoteForm({ jobId, noteId }: { jobId: string; noteId: string }) {
  const [state, formAction, isPending] = useActionState<
    DeleteNoteActionState,
    FormData
  >(deleteNote, {});

  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="noteId" value={noteId} />
      <Button
        type="submit"
        variant="ghost"
        disabled={isPending}
        aria-label="Delete note"
        className="px-2 py-1 text-xs text-red-700 hover:bg-red-50"
      >
        {isPending ? "Deleting..." : "Delete"}
      </Button>
      {state.formError ? (
        <p className="text-xs text-red-600" role="alert">
          {state.formError}
        </p>
      ) : null}
    </form>
  );
}

export function NotesList({ jobId, notes }: NotesListProps) {
  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <article
          key={note.id}
          className="rounded-md border border-slate-200 bg-slate-50 p-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <time className="text-xs font-medium text-slate-500">
              {dateFormatter.format(note.createdAt)}
            </time>
            <DeleteNoteForm jobId={jobId} noteId={note.id} />
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {note.body}
          </p>
        </article>
      ))}
    </div>
  );
}
