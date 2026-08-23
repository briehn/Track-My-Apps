"use client";

import { useActionState } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  deleteJob,
  type JobManagementActionState,
} from "@/features/jobs/actions";

type JobDeleteDialogProps = {
  company: string;
  jobId: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
};

const initialDeleteState: JobManagementActionState = {};

export function JobDeleteDialog({
  company,
  jobId,
  onOpenChange,
  open,
  title,
}: JobDeleteDialogProps) {
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteJob,
    initialDeleteState,
  );

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => onOpenChange(nextOpen)}>
      <DialogContent>
        <DialogTitle>Delete job?</DialogTitle>
        <div className="mt-4 border-l-2 border-red-300 pl-3 dark:border-red-400/60">
          <p className="font-medium text-slate-950 dark:text-slate-100">{title}</p>
          <p className="mt-0.5 text-slate-600 dark:text-slate-300">{company}</p>
        </div>
        <DialogDescription className="mt-4">
          This permanently deletes the job and its related notes, contacts, and analysis. This action cannot be undone.
        </DialogDescription>

        <form action={deleteAction} className="mt-5 flex justify-end gap-2">
          <input type="hidden" name="jobId" value={jobId} />
          <input type="hidden" name="confirmDelete" value="on" />
          <DialogClose render={<Button type="button" variant="secondary" disabled={isDeleting} />}>
            Cancel
          </DialogClose>
          <Button type="submit" variant="destructive" disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete job"}
          </Button>
        </form>
        {deleteState.formError ? (
          <p className="mt-3 text-sm text-red-700 dark:text-red-300" role="alert">
            {deleteState.formError}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
