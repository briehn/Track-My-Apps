import { JobCreateForm } from "@/features/jobs/components/job-create-form";
import { LinkButton } from "@/components/ui/link-button";

export default function NewJobPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Add job</h1>
          <p className="mt-1 text-sm text-slate-600">
            Save a role manually so you can track it through the application
            process.
          </p>
        </div>
        <LinkButton href="/jobs" variant="secondary">
          Back to jobs
        </LinkButton>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <JobCreateForm />
      </div>
    </div>
  );
}
