"use client";

import { useActionState, useRef } from "react";

import { updateJobStatus, type UpdateJobStatusActionState } from "@/features/jobs/actions";
import type { JobDetail } from "@/features/jobs/queries";
import { applicationStatusOptions } from "@/features/jobs/status";

type JobStatusFormProps = {
  jobId: string;
  currentStatus: JobDetail["status"];
};

const initialState: UpdateJobStatusActionState = {};

export function JobStatusForm({
  jobId,
  currentStatus,
}: JobStatusFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    updateJobStatus,
    initialState,
  );

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <input type="hidden" name="jobId" value={jobId} />
      <label htmlFor="status" className="text-sm font-medium text-slate-950">
        Application status
      </label>
      <select
        key={currentStatus}
        id="status"
        name="status"
        defaultValue={currentStatus}
        disabled={isPending}
        onChange={() => {
          formRef.current?.requestSubmit();
        }}
        className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
      >
        {applicationStatusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {isPending ? (
        <p className="text-sm text-slate-500" role="status" aria-live="polite">
          Saving status...
        </p>
      ) : null}
      {state.formError ? (
        <p className="text-sm text-red-600" role="alert">
          {state.formError}
        </p>
      ) : null}
    </form>
  );
}
