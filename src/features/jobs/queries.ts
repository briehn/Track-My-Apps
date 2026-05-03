import { requireUser } from "@/features/auth/require-user";
import { prisma } from "@/server/db/prisma";

export async function getJobsForCurrentUser() {
  const user = await requireUser();

  return prisma.job.findMany({
    where: {
      userId: user.id,
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
    },
  });
}

export type JobListItem = Awaited<
  ReturnType<typeof getJobsForCurrentUser>
>[number];

export type JobDetail = NonNullable<
  Awaited<ReturnType<typeof getJobForCurrentUser>>
>;
