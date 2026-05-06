"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/features/auth/require-user";
import {
  getProfileFormFieldErrors,
  profileFormInputSchema,
  toProfileInput,
  type ProfileFormFieldName,
} from "@/features/profiles/schemas";
import { prisma } from "@/server/db/prisma";

export type UpsertProfileActionState = {
  fieldErrors?: Partial<Record<ProfileFormFieldName, string[]>>;
  formError?: string;
  successMessage?: string;
};

export async function upsertProfile(
  _previousState: UpsertProfileActionState,
  formData: FormData,
): Promise<UpsertProfileActionState> {
  const user = await requireUser();

  const parsedForm = profileFormInputSchema.safeParse({
    targetTitleOption: formData.get("targetTitleOption") || undefined,
    targetTitleOther: formData.get("targetTitleOther"),
    locationPreference: formData.get("locationPreference"),
    workPreferences: formData.getAll("workPreferences"),
    yearsOfExperience: formData.get("yearsOfExperience") || undefined,
    skills: formData.get("skills"),
    experienceSummary: formData.get("experienceSummary"),
    resumeText: formData.get("resumeText"),
    portfolioUrl: formData.get("portfolioUrl"),
    githubUrl: formData.get("githubUrl"),
    linkedinUrl: formData.get("linkedinUrl"),
  });

  if (!parsedForm.success) {
    return {
      fieldErrors: getProfileFormFieldErrors(parsedForm.error),
    };
  }

  const profileInput = toProfileInput(parsedForm.data);

  try {
    await prisma.userProfile.upsert({
      where: {
        userId: user.id,
      },
      create: {
        userId: user.id,
        ...profileInput,
      },
      update: profileInput,
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
