"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { updateJob, type UpdateJobActionState } from "@/features/jobs/actions";
import {
  JobFormFields,
  type JobFormValues,
} from "@/features/jobs/components/job-form-fields";
import type { JobDetail } from "@/features/jobs/queries";

type JobEditFormProps = {
  job: JobDetail;
};

const initialState: UpdateJobActionState = {};

function toDateInputValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : undefined;
}

function toJobFormValues(job: JobDetail): JobFormValues {
  return {
    company: job.company,
    title: job.title,
    location: job.location ?? undefined,
    remoteType: job.remoteType ?? undefined,
    employmentType: job.employmentType ?? undefined,
    source: job.source ?? undefined,
    url: job.url ?? undefined,
    salaryMin: job.salaryMin?.toString(),
    salaryMax: job.salaryMax?.toString(),
    salaryCurrency: job.salaryCurrency ?? undefined,
    description: job.description ?? undefined,
    deadline: toDateInputValue(job.deadline),
  };
}

export function JobEditForm({ job }: JobEditFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateJob,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="jobId" value={job.id} />

      {state.formError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.formError}
        </div>
      ) : null}

      <JobFormFields
        errors={state.fieldErrors}
        defaultValues={toJobFormValues(job)}
      />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
