import { requireUser } from "@/features/auth/require-user";
import { buildJobsCsv } from "@/features/jobs/csv";
import { prisma } from "@/server/db/prisma";

function getStatusFilter(searchParams: URLSearchParams) {
  const status = searchParams.get("status");

  if (status === "active") {
    return {
      not: "ARCHIVED" as const,
    };
  }

  if (status === "archived") {
    return "ARCHIVED" as const;
  }

  return undefined;
}

function getCsvFileName(statusParam: string | null) {
  const dateStamp = new Date().toISOString().slice(0, 10);

  if (statusParam === "archived") {
    return `jobs-archived-${dateStamp}.csv`;
  }

  if (statusParam === "active") {
    return `jobs-active-${dateStamp}.csv`;
  }

  return `jobs-all-${dateStamp}.csv`;
}

export async function GET(request: Request) {
  const user = await requireUser();
  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const statusFilter = getStatusFilter(url.searchParams);

  const jobs = await prisma.job.findMany({
    where: {
      userId: user.id,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      company: true,
      title: true,
      status: true,
      location: true,
      remoteType: true,
      employmentType: true,
      url: true,
      source: true,
      salaryMin: true,
      salaryMax: true,
      deadline: true,
      followUpAt: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          notes: true,
        },
      },
    },
  });

  const csv = buildJobsCsv(
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
      deadline: job.deadline,
      followUpDate: job.followUpAt,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      notesCount: job._count.notes,
    })),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${getCsvFileName(statusParam)}"`,
      "Cache-Control": "no-store",
    },
  });
}

