"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/features/auth/require-user";
import { profileSchema } from "@/features/profiles/schemas";
import { prisma } from "@/server/db/prisma";

export type UpsertProfileActionState = {
  fieldErrors?: Partial<Record<keyof z.infer<typeof profileSchema>, string[]>>;
  formError?: string;
  successMessage?: string;
};

export async function upsertProfile(
  _previousState: UpsertProfileActionState,
  formData: FormData,
): Promise<UpsertProfileActionState> {
  const user = await requireUser();

  const parsedInput = profileSchema.safeParse({
    targetTitle: formData.get("targetTitle"),
    locationPreference: formData.get("locationPreference"),
    workPreference: formData.get("workPreference") || undefined,
    yearsOfExperience: formData.get("yearsOfExperience"),
    skills: formData.get("skills"),
    experienceSummary: formData.get("experienceSummary"),
    resumeText: formData.get("resumeText"),
    portfolioUrl: formData.get("portfolioUrl"),
    githubUrl: formData.get("githubUrl"),
    linkedinUrl: formData.get("linkedinUrl"),
  });

  if (!parsedInput.success) {
    return {
      fieldErrors: parsedInput.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.userProfile.upsert({
      where: {
        userId: user.id,
      },
      create: {
        userId: user.id,
        ...parsedInput.data,
      },
      update: parsedInput.data,
    });
  } catch {
    return {
      formError: "Your profile could not be saved.",
    };
  }

  revalidatePath("/profile");

  return {
    successMessage: "Profile saved.",
  };
}
