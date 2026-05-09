"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  confirmJobImport,
  previewJobImport,
  type ConfirmJobImportActionState,
  type PreviewJobImportActionState,
} from "@/features/jobs/import-actions";
import { JOB_IMPORT_FIELDS } from "@/features/jobs/import-mapping";
import { JobImportMappingForm } from "@/features/jobs/components/job-import-mapping-form";
import { JobImportPreviewTable } from "@/features/jobs/components/job-import-preview-table";
import { JobImportUploadForm } from "@/features/jobs/components/job-import-upload-form";

const initialPreviewState: PreviewJobImportActionState = {};
const initialConfirmState: ConfirmJobImportActionState = {};

export function JobImportWorkflow() {
  const [previewState, previewAction, isPreviewPending] = useActionState(
    previewJobImport,
    initialPreviewState,
  );
  const [confirmState, confirmAction, isConfirmPending] = useActionState(
    confirmJobImport,
    initialConfirmState,
  );

  return (
    <div className="space-y-6">
      <JobImportUploadForm
        action={previewAction}
        isPending={isPreviewPending}
        state={previewState}
      />

      {previewState.columns && previewState.csvText ? (
        <JobImportMappingForm
          action={previewAction}
          columns={previewState.columns}
          csvText={previewState.csvText}
          isPending={isPreviewPending}
          mapping={previewState.mapping}
        />
      ) : null}

      {previewState.preview && previewState.csvText ? (
        <>
          <JobImportPreviewTable preview={previewState.preview} />

          <form
            action={confirmAction}
            className="space-y-4 rounded-md border border-slate-200 bg-white p-4"
          >
            <input type="hidden" name="csvText" value={previewState.csvText} />
            {JOB_IMPORT_FIELDS.map((fieldConfig) => (
              <input
                key={fieldConfig.field}
                type="hidden"
                name={`mapping:${fieldConfig.field}`}
                value={previewState.mapping?.[fieldConfig.field] ?? ""}
              />
            ))}

            {confirmState.formError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {confirmState.formError}
              </div>
            ) : null}

            {confirmState.successMessage ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <p>{confirmState.successMessage}</p>
                <p className="mt-1">
                  Skipped {confirmState.skippedInvalidRowCount ?? 0} invalid rows and{" "}
                  {confirmState.skippedDuplicateCount ?? 0} likely duplicates.
                </p>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                Confirm import to add only valid, non-duplicate rows to your account.
              </p>
              <Button type="submit" disabled={isConfirmPending}>
                {isConfirmPending ? "Importing..." : "Confirm import"}
              </Button>
            </div>
          </form>
        </>
      ) : null}
    </div>
  );
}

