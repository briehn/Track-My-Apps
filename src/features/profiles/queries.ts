import { requireUser } from "@/features/auth/require-user";
import { prisma } from "@/server/db/prisma";

export async function getProfileForCurrentUser() {
  const user = await requireUser();

  return prisma.userProfile.findUnique({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      targetTitle: true,
      locationPreference: true,
      workPreference: true,
      yearsOfExperience: true,
      skills: true,
      experienceSummary: true,
      resumeText: true,
      portfolioUrl: true,
      githubUrl: true,
      linkedinUrl: true,
      updatedAt: true,
    },
  });
}

export type UserProfileDetail = Awaited<ReturnType<typeof getProfileForCurrentUser>>;
