"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  archiveJob,
  deleteJob,
  type JobManagementActionState,
} from "@/features/jobs/actions";

type JobManagementActionsProps = {
  jobId: string;
  isArchived: boolean;
};

const initialArchiveState: JobManagementActionState = {};
const initialDeleteState: JobManagementActionState = {};

export function JobManagementActions({
  jobId,
  isArchived,
}: JobManagementActionsProps) {
  const [archiveState, archiveAction, isArchiving] = useActionState(
    archiveJob,
    initialArchiveState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteJob,
    initialDeleteState,
  );

  return (
    <div className="space-y-6">
      <form action={archiveAction} className="space-y-3">
        <input type="hidden" name="jobId" value={jobId} />
        <p className="text-sm text-slate-600">
          Archived jobs leave the active list but remain available from the
          archived view.
        </p>
        {archiveState.formError ? (
          <p className="text-sm text-red-600">{archiveState.formError}</p>
        ) : null}
        <Button type="submit" variant="secondary" disabled={isArchiving || isArchived}>
          {isArchived
            ? "Already archived"
            : isArchiving
              ? "Archiving..."
              : "Archive job"}
        </Button>
      </form>

      <form action={deleteAction} className="space-y-3 border-t border-slate-200 pt-5">
        <input type="hidden" name="jobId" value={jobId} />
        <div className="flex items-start gap-2">
          <input
            id="confirmDelete"
            name="confirmDelete"
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-400"
          />
          <label htmlFor="confirmDelete" className="text-sm text-slate-700">
            I understand this permanently deletes the job and its related data.
          </label>
        </div>
        {deleteState.formError ? (
          <p className="text-sm text-red-600">{deleteState.formError}</p>
        ) : null}
        <Button
          type="submit"
          variant="secondary"
          disabled={isDeleting}
          className="border-red-200 text-red-700 hover:bg-red-50"
        >
          {isDeleting ? "Deleting..." : "Delete permanently"}
        </Button>
      </form>
    </div>
  );
}
