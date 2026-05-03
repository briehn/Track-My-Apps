"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { updateJobStatus, type UpdateJobStatusActionState } from "@/features/jobs/actions";
import type { JobDetail } from "@/features/jobs/queries";

type JobStatusFormProps = {
  jobId: string;
  currentStatus: JobDetail["status"];
};

const initialState: UpdateJobStatusActionState = {};

const statusOptions: Array<{ value: JobDetail["status"]; label: string }> = [
  { value: "SAVED", label: "Saved" },
  { value: "APPLIED", label: "Applied" },
  { value: "INTERVIEWING", label: "Interviewing" },
  { value: "OFFER", label: "Offer" },
  { value: "REJECTED", label: "Rejected" },
  { value: "ARCHIVED", label: "Archived" },
];

export function JobStatusForm({
  jobId,
  currentStatus,
}: JobStatusFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateJobStatus,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="jobId" value={jobId} />
      <div>
        <label htmlFor="status" className="text-sm font-medium text-slate-950">
          Application status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={currentStatus}
          className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {state.formError ? (
        <p className="text-sm text-red-600">{state.formError}</p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Updating..." : "Update status"}
      </Button>
    </form>
  );
}
