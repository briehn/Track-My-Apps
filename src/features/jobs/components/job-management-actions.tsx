"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { JobDeleteDialog } from "@/features/jobs/components/job-delete-dialog";
import {
  archiveJob,
  type JobManagementActionState,
} from "@/features/jobs/actions";

type JobManagementActionsProps = {
  company: string;
  jobId: string;
  isArchived: boolean;
  title: string;
};

const initialArchiveState: JobManagementActionState = {};

export function JobManagementActions({
  company,
  jobId,
  isArchived,
  title,
}: JobManagementActionsProps) {
  const [archiveState, archiveAction, isArchiving] = useActionState(
    archiveJob,
    initialArchiveState,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <form action={archiveAction} className="space-y-2">
        <input type="hidden" name="jobId" value={jobId} />
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-950 dark:text-slate-100">Archive job</p>
          <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">
            Archived jobs leave the active list but remain available from the archived view.
          </p>
        </div>
        {archiveState.formError ? (
          <p className="text-sm text-red-600" role="alert">
            {archiveState.formError}
          </p>
        ) : null}
        {isArchived ? (
          <p className="text-sm text-emerald-800 dark:text-emerald-200">
            This job is archived. You can move it back to active using the status control above.
          </p>
        ) : (
          <Button type="submit" variant="secondary" size="sm" disabled={isArchiving}>
            {isArchiving ? "Archiving..." : "Archive Job"}
          </Button>
        )}
      </form>

      <div className="border-t border-slate-200/80 pt-3 dark:border-slate-800">
        <p className="text-sm font-medium text-red-800 dark:text-red-200">Permanently delete</p>
        <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
          This permanently deletes the job and its related data.
        </p>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="mt-3"
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          Delete job
        </Button>
      </div>

      <JobDeleteDialog
        company={company}
        jobId={jobId}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={title}
      />
    </div>
  );
}
