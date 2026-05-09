import { LinkButton } from "@/components/ui/link-button";
import { JobImportWorkflow } from "@/features/jobs/components/job-import-workflow";

export default function JobImportPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Import jobs</h1>
          <p className="mt-1 text-sm text-slate-600">
            Upload a CSV tracker, map its columns, review validation results, and confirm the import into your account.
          </p>
        </div>
        <LinkButton href="/jobs" variant="secondary">
          Back to jobs
        </LinkButton>
      </div>

      <JobImportWorkflow />
    </div>
  );
}

