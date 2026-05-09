"use client";

import { Button } from "@/components/ui/button";
import type { PreviewJobImportActionState } from "@/features/jobs/import-actions";

type JobImportUploadFormProps = {
  action: (formData: FormData) => void;
  isPending: boolean;
  state: PreviewJobImportActionState;
};

export function JobImportUploadForm({
  action,
  isPending,
  state,
}: JobImportUploadFormProps) {
  return (
    <form action={action} className="space-y-4 rounded-md border border-slate-200 bg-white p-5">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-slate-950">1. Upload CSV</h2>
        <p className="text-sm text-slate-600">
          Upload a CSV job tracker with a header row. Files must be 2 MB or smaller and no more than 500 rows.
        </p>
      </div>

      <div>
        <label htmlFor="file" className="text-sm font-medium text-slate-950">
          CSV file
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".csv,text/csv"
          className="mt-1 block w-full text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
        />
      </div>

      {state.formError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.formError}
        </div>
      ) : null}

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? "Preparing preview..." : "Upload and preview"}
      </Button>
    </form>
  );
}
