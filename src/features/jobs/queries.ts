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

export type JobListItem = Awaited<
  ReturnType<typeof getJobsForCurrentUser>
>[number];
