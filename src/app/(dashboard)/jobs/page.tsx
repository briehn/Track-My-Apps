import Link from "next/link";

import { EmptyState } from "@/components/empty-states/empty-state";
import { JobList } from "@/features/jobs/components/job-list";
import { getJobsForCurrentUser } from "@/features/jobs/queries";

export default async function JobsPage() {
  const jobs = await getJobsForCurrentUser();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Jobs</h1>
          <p className="mt-1 text-sm text-slate-600">
            View roles you have manually saved.
          </p>
        </div>
        <Link
          href="/jobs/new"
          className="inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        >
          Add job
        </Link>
      </div>

      {jobs.length > 0 ? (
        <JobList jobs={jobs} />
      ) : (
        <EmptyState
          title="No saved jobs yet"
          description="Start by manually saving a role. Filters and detail pages will come in later milestones."
          action={
            <Link
              href="/jobs/new"
              className="inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              Add job
            </Link>
          }
        />
      )}
    </div>
  );
}
