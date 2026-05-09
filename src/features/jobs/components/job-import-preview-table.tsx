import type { JobImportPreviewResult } from "@/features/jobs/import-validation";

type JobImportPreviewTableProps = {
  preview: JobImportPreviewResult;
};

const outcomeLabels: Record<
  JobImportPreviewResult["rows"][number]["outcome"],
  string
> = {
  valid: "Valid",
  invalid: "Invalid",
  duplicate: "Likely duplicate",
};

const outcomeClasses: Record<
  JobImportPreviewResult["rows"][number]["outcome"],
  string
> = {
  valid: "bg-emerald-100 text-emerald-800",
  invalid: "bg-red-100 text-red-800",
  duplicate: "bg-amber-100 text-amber-800",
};

export function JobImportPreviewTable({
  preview,
}: JobImportPreviewTableProps) {
  return (
    <div className="space-y-4 rounded-md border border-slate-200 bg-white p-5">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-slate-950">3. Review preview</h2>
        <p className="text-sm text-slate-600">
          Only valid, non-duplicate rows will be imported. Invalid rows and likely duplicates are skipped by default.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Valid rows
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">
            {preview.validRowCount}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Invalid rows
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">
            {preview.invalidRowCount}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Likely duplicates
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">
            {preview.likelyDuplicateCount}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-slate-700">Row</th>
              <th className="px-3 py-2 text-left font-medium text-slate-700">Company</th>
              <th className="px-3 py-2 text-left font-medium text-slate-700">Title</th>
              <th className="px-3 py-2 text-left font-medium text-slate-700">Status</th>
              <th className="px-3 py-2 text-left font-medium text-slate-700">Outcome</th>
              <th className="px-3 py-2 text-left font-medium text-slate-700">Issues</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {preview.rows.map((row) => (
              <tr key={row.rowNumber}>
                <td className="px-3 py-2 align-top text-slate-700">{row.rowNumber}</td>
                <td className="px-3 py-2 align-top text-slate-700">
                  {row.fieldValues.company || "Not provided"}
                </td>
                <td className="px-3 py-2 align-top text-slate-700">
                  {row.fieldValues.title || "Not provided"}
                </td>
                <td className="px-3 py-2 align-top text-slate-700">
                  {row.fieldValues.status || "Saved"}
                </td>
                <td className="px-3 py-2 align-top">
                  <span
                    className={[
                      "inline-flex rounded-full px-2 py-1 text-xs font-medium",
                      outcomeClasses[row.outcome],
                    ].join(" ")}
                  >
                    {outcomeLabels[row.outcome]}
                  </span>
                </td>
                <td className="px-3 py-2 align-top text-slate-700">
                  {row.errors.length > 0 ? row.errors.join(" ") : row.duplicateReason ?? "Ready to import."}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

