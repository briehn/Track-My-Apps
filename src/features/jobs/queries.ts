import { requireUser } from "@/features/auth/require-user";
import type { JobListFilters } from "@/features/jobs/list-params";
import { prisma } from "@/server/db/prisma";

type JobListStatusFilter = "active" | "archived";

export async function getJobsForCurrentUser(
  statusFilter: JobListStatusFilter = "active",
  filters?: Omit<JobListFilters, "view">,
) {
  const user = await requireUser();
  const normalizedSearchText = filters?.q?.trim() ?? "";

  const statusWhereCondition =
    statusFilter === "archived"
      ? "ARCHIVED"
      : {
          not: "ARCHIVED" as const,
        };

  const normalizedStatuses =
    filters?.statuses.filter((statusValue) =>
      statusFilter === "archived"
        ? statusValue === "ARCHIVED"
        : statusValue !== "ARCHIVED",
    ) ?? [];

  const effectiveStatusFilter =
    normalizedStatuses.length > 0
      ? {
          in: normalizedStatuses,
        }
      : null;

  const orderBy =
    filters?.sort === "deadlineSoonest"
      ? [
          { deadline: { sort: "asc" as const, nulls: "last" as const } },
          { createdAt: "desc" as const },
        ]
      : filters?.sort === "followUpSoonest"
        ? [
            { followUpAt: { sort: "asc" as const, nulls: "last" as const } },
            { createdAt: "desc" as const },
          ]
        : [{ createdAt: "desc" as const }];

  return prisma.job.findMany({
    where: {
      userId: user.id,
      status: effectiveStatusFilter ?? statusWhereCondition,
      ...(filters?.remoteTypes && filters.remoteTypes.length > 0
        ? {
            remoteType: {
              in: filters.remoteTypes,
            },
          }
        : {}),
      ...(filters?.employmentTypes && filters.employmentTypes.length > 0
        ? {
            employmentType: {
              in: filters.employmentTypes,
            },
          }
        : {}),
      ...(normalizedSearchText
        ? {
            OR: [
              {
                company: {
                  contains: normalizedSearchText,
                  mode: "insensitive" as const,
                },
              },
              {
                title: {
                  contains: normalizedSearchText,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    },
    orderBy,
    select: {
      id: true,
      company: true,
      title: true,
      location: true,
      remoteType: true,
      employmentType: true,
      status: true,
      deadline: true,
      followUpAt: true,
      createdAt: true,
    },
  });
}

export async function getJobForCurrentUser(jobId: string) {
  const user = await requireUser();

  return prisma.job.findFirst({
    where: {
      id: jobId,
      userId: user.id,
    },
    select: {
      id: true,
      company: true,
      title: true,
      location: true,
      remoteType: true,
      employmentType: true,
      source: true,
      url: true,
      salaryMin: true,
      salaryMax: true,
      salaryCurrency: true,
      description: true,
      status: true,
      deadline: true,
      appliedAt: true,
      followUpAt: true,
      createdAt: true,
      updatedAt: true,
      analysis: {
        select: {
          summary: true,
          requiredSkills: true,
          preferredSkills: true,
          responsibilities: true,
          keywords: true,
          seniorityLevel: true,
          updatedAt: true,
        },
      },
    },
  });
}

export type JobListItem = Awaited<
  ReturnType<typeof getJobsForCurrentUser>
>[number];

export type JobDetail = NonNullable<
  Awaited<ReturnType<typeof getJobForCurrentUser>>
>;
