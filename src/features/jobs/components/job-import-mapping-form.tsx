"use client";

import { Button } from "@/components/ui/button";
import {
  JOB_IMPORT_FIELDS,
  type JobImportColumn,
  type JobImportColumnMapping,
} from "@/features/jobs/import-mapping";

type JobImportMappingFormProps = {
  action: (formData: FormData) => void;
  columns: JobImportColumn[];
  csvText: string;
  isPending: boolean;
  mapping?: JobImportColumnMapping;
};

export function JobImportMappingForm({
  action,
  columns,
  csvText,
  isPending,
  mapping,
}: JobImportMappingFormProps) {
  return (
    <form action={action} className="space-y-4 rounded-md border border-slate-200 bg-white p-5">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-slate-950">2. Map columns</h2>
        <p className="text-sm text-slate-600">
          Confirm how your CSV columns should map into Track My Apps, then refresh the server-side preview.
        </p>
      </div>

      <input type="hidden" name="csvText" value={csvText} />

      <div className="grid gap-4 md:grid-cols-2">
        {JOB_IMPORT_FIELDS.map((fieldConfig) => (
          <div key={fieldConfig.field}>
            <label
              htmlFor={`mapping:${fieldConfig.field}`}
              className="text-sm font-medium text-slate-950"
            >
              {fieldConfig.label}
              {fieldConfig.required ? " *" : ""}
            </label>
            <select
              id={`mapping:${fieldConfig.field}`}
              name={`mapping:${fieldConfig.field}`}
              defaultValue={mapping?.[fieldConfig.field] ?? ""}
              className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Ignore this field</option>
              {columns.map((column) => (
                <option key={column.key} value={column.key}>
                  {column.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <Button type="submit" variant="secondary" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? "Refreshing preview..." : "Refresh preview"}
      </Button>
    </form>
  );
}
