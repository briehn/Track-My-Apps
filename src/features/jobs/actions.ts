"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/features/auth/require-user";
import { createJobSchema, updateJobStatusSchema } from "@/features/jobs/schemas";
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

export type UpdateJobStatusActionState = {
  formError?: string;
};

export async function updateJobStatus(
  _previousState: UpdateJobStatusActionState,
  formData: FormData,
): Promise<UpdateJobStatusActionState> {
  const user = await requireUser();

  const parsedInput = updateJobStatusSchema.safeParse({
    jobId: formData.get("jobId"),
    status: formData.get("status"),
  });

  if (!parsedInput.success) {
    return {
      formError: "Choose a valid status.",
    };
  }

  const job = await prisma.job.findFirst({
    where: {
      id: parsedInput.data.jobId,
      userId: user.id,
    },
    select: {
      id: true,
      appliedAt: true,
    },
  });

  if (!job) {
    return {
      formError: "This job could not be found.",
    };
  }

  const updateResult = await prisma.job.updateMany({
    where: {
      id: job.id,
      userId: user.id,
    },
    data: {
      status: parsedInput.data.status,
      appliedAt:
        parsedInput.data.status === "APPLIED" && job.appliedAt === null
          ? new Date()
          : undefined,
    },
  });

  if (updateResult.count === 0) {
    return {
      formError: "This job could not be updated.",
    };
  }

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${job.id}`);

  return {};
}
