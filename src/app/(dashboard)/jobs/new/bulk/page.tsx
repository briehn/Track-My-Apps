import { LinkButton } from "@/components/ui/link-button";
import { BulkJobUrlImportWorkflow } from "@/features/jobs/components/bulk-job-url-import-workflow";

export default function BulkAddJobsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Bulk add jobs</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Paste job posting URLs, review the imported details, and choose which jobs to add.
          </p>
        </div>
        <LinkButton href="/jobs" variant="secondary">
          Back to jobs
        </LinkButton>
      </div>

      <BulkJobUrlImportWorkflow />
    </div>
  );
}
