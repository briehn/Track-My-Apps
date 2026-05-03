"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/features/auth/require-user";
import { createJobSchema } from "@/features/jobs/schemas";
import { prisma } from "@/server/db/prisma";

export type CreateJobActionState = {
  fieldErrors?: Partial<Record<keyof z.infer<typeof createJobSchema>, string[]>>;
  formError?: string;
};

export async function createJob(
  _previousState: CreateJobActionState,
  formData: FormData,
): Promise<CreateJobActionState> {
  const user = await requireUser();

  const parsedInput = createJobSchema.safeParse({
    company: formData.get("company"),
    title: formData.get("title"),
    location: formData.get("location"),
    remoteType: formData.get("remoteType") || undefined,
    employmentType: formData.get("employmentType") || undefined,
    source: formData.get("source"),
    url: formData.get("url"),
    salaryMin: formData.get("salaryMin"),
    salaryMax: formData.get("salaryMax"),
    salaryCurrency: formData.get("salaryCurrency"),
    description: formData.get("description"),
    deadline: formData.get("deadline"),
  });

  if (!parsedInput.success) {
    return {
      fieldErrors: parsedInput.error.flatten().fieldErrors,
    };
  }

  await prisma.job.create({
    data: {
      ...parsedInput.data,
      userId: user.id,
    },
  });

  redirect("/jobs");
}
