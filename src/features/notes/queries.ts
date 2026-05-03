import { requireUser } from "@/features/auth/require-user";
import { prisma } from "@/server/db/prisma";

export async function getNotesForJobForCurrentUser(jobId: string) {
  const user = await requireUser();

  return prisma.note.findMany({
    where: {
      jobId,
      userId: user.id,
      job: {
        userId: user.id,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      body: true,
      createdAt: true,
    },
  });
}

export type JobNote = Awaited<
  ReturnType<typeof getNotesForJobForCurrentUser>
>[number];
