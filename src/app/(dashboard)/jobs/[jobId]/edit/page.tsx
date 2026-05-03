import Link from "next/link";
import { notFound } from "next/navigation";

import { JobEditForm } from "@/features/jobs/components/job-edit-form";
import { getJobForCurrentUser } from "@/features/jobs/queries";

type EditJobPageProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export default async function EditJobPage({ params }: EditJobPageProps) {
  const { jobId } = await params;
  const job = await getJobForCurrentUser(jobId);

  if (!job) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href={`/jobs/${job.id}`}
        className="inline-flex text-sm font-medium text-slate-600 hover:text-slate-950"
      >
        Back to job
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Edit job</h1>
        <p className="mt-1 text-sm text-slate-600">
          Update the saved posting details for {job.company}.
        </p>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <JobEditForm job={job} />
      </div>
    </div>
  );
}
