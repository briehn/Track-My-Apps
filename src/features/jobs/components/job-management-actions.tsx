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
    <div className="space-y-5">
      <form
        action={archiveAction}
        className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4"
      >
        <input type="hidden" name="jobId" value={jobId} />
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-950">Archive job</p>
          <p className="text-sm text-slate-600">
            Archived jobs leave the active list but remain available from the archived view.
          </p>
        </div>
        {archiveState.formError ? (
          <p className="text-sm text-red-600" role="alert">
            {archiveState.formError}
          </p>
        ) : null}
        {isArchived ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            This job is archived. You can move it back to active using the status control above.
          </p>
        ) : (
          <Button type="submit" disabled={isArchiving} className="w-full sm:w-auto">
            {isArchiving ? "Archiving..." : "Archive job"}
          </Button>
        )}
      </form>

      <details className="rounded-md border border-red-200 bg-red-50/50 p-4">
        <summary className="cursor-pointer text-sm font-medium text-red-800">
          Danger zone: permanent delete
        </summary>
        <form action={deleteAction} className="mt-4 space-y-3">
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
            <p className="text-sm text-red-700" role="alert">
              {deleteState.formError}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="secondary"
            disabled={isDeleting}
            className="w-full border-red-200 text-red-700 hover:bg-red-100 sm:w-auto"
          >
            {isDeleting ? "Deleting..." : "Delete permanently"}
          </Button>
        </form>
      </details>
    </div>
  );
}
