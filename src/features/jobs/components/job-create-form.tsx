"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { createJob, type CreateJobActionState } from "@/features/jobs/actions";
import { JobFormFields } from "@/features/jobs/components/job-form-fields";
import {
  importJobUrlForCurrentUser,
  type JobUrlImportActionResult,
} from "@/features/jobs/import-url-actions";
import {
  getFirstInvalidJobFormField,
  mergeImportedJobDraft,
  type JobFormValues,
} from "@/features/jobs/job-form-state";

const initialState: CreateJobActionState = {};

function ImportNotice({ result }: { result: JobUrlImportActionResult }) {
  if (!result.success) {
    return (
      <div
        role="alert"
        className={result.unavailable
          ? "rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
          : "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"}
      >
        {result.message}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
      <p>Job details imported. Review and save when ready.</p>
      {result.duplicate ? (
        <p>
          This job may already be in your tracker. {" "}
          <Link href={`/jobs/${result.duplicate.jobId}`} className="font-medium underline underline-offset-2">
            View existing job
          </Link>
        </p>
      ) : null}
      {result.warnings.map((warning) => (
        <p key={warning.code} className="text-amber-800">
          {warning.message}
        </p>
      ))}
    </div>
  );
}

export function JobCreateForm() {
  const [values, setValues] = useState<JobFormValues>({});
  const [importUrl, setImportUrl] = useState("");
  const [importResult, setImportResult] = useState<JobUrlImportActionResult>();
  const [isImporting, startImportTransition] = useTransition();
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

  const handleImport = () => {
    const submittedUrl = importUrl;

    startImportTransition(async () => {
      const result = await importJobUrlForCurrentUser(submittedUrl);
      setImportResult(result);

      if (result.success) {
        setValues((currentValues) => mergeImportedJobDraft(currentValues, result.seed));
      }
    });
  };

  return (
    <form action={formAction} className="space-y-6">
      {state.formError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.formError}
        </div>
      ) : null}

      <div className="space-y-3 border-b border-slate-200 pb-5">
        <div>
          <label htmlFor="importUrl" className="text-sm font-medium text-slate-950">
            Job posting URL
          </label>
          <p className="mt-1 text-sm text-slate-600">
            Import supported job details, then review them below.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="importUrl"
            value={importUrl}
            onChange={(event) => setImportUrl(event.currentTarget.value)}
            type="url"
            placeholder="https://..."
            className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          <Button type="button" onClick={handleImport} disabled={isImporting || !importUrl.trim()}>
            {isImporting ? "Importing..." : "Import from URL"}
          </Button>
        </div>
        {importResult ? <ImportNotice result={importResult} /> : null}
      </div>

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
