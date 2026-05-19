import { normalizeJobsSearchParams } from "@/features/jobs/list-params";
import { getJobsExportForCurrentUser } from "@/features/jobs/queries";
import { buildJobsXlsx } from "@/features/jobs/xlsx";

function getXlsxFileName(statusView: "active" | "archived") {
  const dateStamp = new Date().toISOString().slice(0, 10);
  return statusView === "archived"
    ? `jobs-archived-${dateStamp}.xlsx`
    : `jobs-active-${dateStamp}.xlsx`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawSearchParams = Object.fromEntries(
    [...url.searchParams.keys()].map((key) => {
      const allValues = url.searchParams.getAll(key);
      return [key, allValues.length > 1 ? allValues : (allValues[0] ?? "")];
    }),
  );
  const filters = normalizeJobsSearchParams(rawSearchParams);
  const isArchivedView = filters.view === "archived";
  const jobs = await getJobsExportForCurrentUser(
    isArchivedView ? "archived" : "active",
    {
      q: filters.q,
      statuses: filters.statuses,
      remoteTypes: filters.remoteTypes,
      employmentTypes: filters.employmentTypes,
      sort: filters.sort,
    },
  );

  const workbookBuffer = await buildJobsXlsx(
    jobs.map((job) => ({
      company: job.company,
      title: job.title,
      status: job.status,
      location: job.location,
      remoteType: job.remoteType,
      employmentType: job.employmentType,
      url: job.url,
      source: job.source,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryCurrency: job.salaryCurrency,
      deadline: job.deadline,
      followUpDate: job.followUpAt,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      notesCount: job._count.notes,
      hasJobAnalysis: Boolean(job.analysis),
    })),
  );

  return new Response(workbookBuffer as BodyInit, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${getXlsxFileName(filters.view)}"`,
      "Cache-Control": "no-store",
    },
  });
}

