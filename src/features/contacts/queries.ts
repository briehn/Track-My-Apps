import { requireUser } from "@/features/auth/require-user";
import { prisma } from "@/server/db/prisma";

export function getJobContactScope(userId: string, jobId: string) {
  return {
    jobId,
    userId,
    job: {
      userId,
    },
  };
}

export async function getJobContactsForCurrentUser(jobId: string) {
  const user = await requireUser();

  return prisma.jobContact.findMany({
    where: getJobContactScope(user.id, jobId),
    orderBy: [{ followUpAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      title: true,
      company: true,
      profileUrl: true,
      email: true,
      contactType: true,
      relevanceNotes: true,
      outreachStatus: true,
      lastContactedAt: true,
      followUpAt: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export type JobContact = Awaited<
  ReturnType<typeof getJobContactsForCurrentUser>
>[number];
