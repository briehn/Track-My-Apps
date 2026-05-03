import { JobCreateForm } from "@/features/jobs/components/job-create-form";

export default function NewJobPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Add job</h1>
        <p className="mt-1 text-sm text-slate-600">
          Save a role manually so you can track it through the application
          process.
        </p>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <JobCreateForm />
      </div>
    </div>
  );
}
