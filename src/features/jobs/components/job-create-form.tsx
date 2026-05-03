"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { createJob, type CreateJobActionState } from "@/features/jobs/actions";
import { JobFormFields } from "@/features/jobs/components/job-form-fields";

const initialState: CreateJobActionState = {};

export function JobCreateForm() {
  const [state, formAction, isPending] = useActionState(
    createJob,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      {state.formError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.formError}
        </div>
      ) : null}

      <JobFormFields errors={state.fieldErrors} />

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save job"}
        </Button>
      </div>
    </form>
  );
}
