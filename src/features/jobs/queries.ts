import { requireUser } from "@/features/auth/require-user";
import { prisma } from "@/server/db/prisma";

type JobListStatusFilter = "active" | "archived";

export async function getJobsForCurrentUser(
  statusFilter: JobListStatusFilter = "active",
) {
  const user = await requireUser();

  return prisma.job.findMany({
    where: {
      userId: user.id,
      status:
        statusFilter === "archived"
          ? "ARCHIVED"
          : {
              not: "ARCHIVED",
            },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      company: true,
      title: true,
      location: true,
      remoteType: true,
      status: true,
      deadline: true,
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
