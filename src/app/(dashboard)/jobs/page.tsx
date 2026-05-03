import { EmptyState } from "@/components/empty-states/empty-state";

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Jobs</h1>
        <p className="mt-1 text-sm text-slate-600">
          Saved jobs and filters will be added in a later milestone.
        </p>
      </div>

      <EmptyState
        title="Job tracking is not implemented yet"
        description="This protected route is ready for the upcoming job creation and job list workflows."
      />
    </div>
  );
}
