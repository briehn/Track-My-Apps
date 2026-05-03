import Link from "next/link";

import { EmptyState } from "@/components/empty-states/empty-state";

export default function JobNotFound() {
  return (
    <div className="mx-auto max-w-3xl">
      <EmptyState
        title="Job not found"
        description="This job may have been deleted, archived under another account, or the link may be incorrect. Go back to your saved jobs to continue."
        action={
          <Link
            href="/jobs"
            className="inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            Back to jobs
          </Link>
        }
      />
    </div>
  );
}
