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
        className="space-y-3 rounded-xl bg-slate-100/70 p-4 dark:bg-slate-900/60"
      >
        <input type="hidden" name="jobId" value={jobId} />
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-950 dark:text-slate-100">Archive Job</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Archived jobs leave the active list but remain available from the archived view.
          </p>
        </div>
        {archiveState.formError ? (
          <p className="text-sm text-red-600" role="alert">
            {archiveState.formError}
          </p>
        ) : null}
        {isArchived ? (
          <p className="rounded-md bg-emerald-100/70 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200">
            This job is archived. You can move it back to active using the status control above.
          </p>
        ) : (
          <Button type="submit" disabled={isArchiving} className="w-full sm:w-auto">
            {isArchiving ? "Archiving..." : "Archive Job"}
          </Button>
        )}
      </form>

      <details className="rounded-xl bg-red-50/70 p-4 dark:bg-red-500/10">
        <summary className="cursor-pointer rounded-md text-sm font-medium text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2 dark:text-red-200 dark:focus-visible:ring-offset-slate-950">
          Danger Zone: Permanent Delete
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
            <label htmlFor="confirmDelete" className="text-sm text-slate-700 dark:text-slate-300">
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
            className="w-full text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-500/20 sm:w-auto"
          >
            {isDeleting ? "Deleting..." : "Permanent Delete"}
          </Button>
        </form>
      </details>
    </div>
  );
}
