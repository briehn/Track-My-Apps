"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { createJob, type CreateJobActionState } from "@/features/jobs/actions";
import { JobFormFields } from "@/features/jobs/components/job-form-fields";
import {
  getFirstInvalidJobFormField,
  type JobFormValues,
} from "@/features/jobs/job-form-state";

const initialState: CreateJobActionState = {};

export function JobCreateForm() {
  const [values, setValues] = useState<JobFormValues>({});
  const [state, formAction, isPending] = useActionState(
    createJob,
    initialState,
  );

  useEffect(() => {
    const firstInvalidField = getFirstInvalidJobFormField(state.fieldErrors);

    if (firstInvalidField) {
      document.getElementById(firstInvalidField)?.focus();
    }
  }, [state.fieldErrors]);

  return (
    <form action={formAction} className="space-y-6">
      {state.formError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.formError}
        </div>
      ) : null}

      <JobFormFields
        errors={state.fieldErrors}
        values={values}
        onValueChange={(fieldName, value) => {
          setValues((currentValues) => ({
            ...currentValues,
            [fieldName]: value,
          }));
        }}
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save job"}
        </Button>
      </div>
    </form>
  );
}
