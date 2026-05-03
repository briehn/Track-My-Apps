"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/features/auth/require-user";
import {
  createJobSchema,
  deleteJobSchema,
  jobIdSchema,
  updateJobSchema,
  updateJobStatusSchema,
} from "@/features/jobs/schemas";
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

export type UpdateJobActionState = {
  fieldErrors?: Partial<Record<keyof z.infer<typeof updateJobSchema>, string[]>>;
  formError?: string;
};

export async function updateJob(
  _previousState: UpdateJobActionState,
  formData: FormData,
): Promise<UpdateJobActionState> {
  const user = await requireUser();

  const parsedInput = updateJobSchema.safeParse({
    jobId: formData.get("jobId"),
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

  const { jobId, ...jobData } = parsedInput.data;

  const updateResult = await prisma.job.updateMany({
    where: {
      id: jobId,
      userId: user.id,
    },
    data: jobData,
  });

  if (updateResult.count === 0) {
    return {
      formError: "This job could not be updated.",
    };
  }

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);

  redirect(`/jobs/${jobId}`);
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

export type JobManagementActionState = {
  formError?: string;
};

export async function archiveJob(
  _previousState: JobManagementActionState,
  formData: FormData,
): Promise<JobManagementActionState> {
  const user = await requireUser();
  const parsedInput = jobIdSchema.safeParse({
    jobId: formData.get("jobId"),
  });

  if (!parsedInput.success) {
    return {
      formError: "This job could not be archived.",
    };
  }

  const updateResult = await prisma.job.updateMany({
    where: {
      id: parsedInput.data.jobId,
      userId: user.id,
    },
    data: {
      status: "ARCHIVED",
    },
  });

  if (updateResult.count === 0) {
    return {
      formError: "This job could not be found.",
    };
  }

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${parsedInput.data.jobId}`);

  redirect("/jobs");
}

export async function deleteJob(
  _previousState: JobManagementActionState,
  formData: FormData,
): Promise<JobManagementActionState> {
  const user = await requireUser();
  const parsedInput = deleteJobSchema.safeParse({
    jobId: formData.get("jobId"),
    confirmDelete: formData.get("confirmDelete"),
  });

  if (!parsedInput.success) {
    return {
      formError:
        parsedInput.error.flatten().fieldErrors.confirmDelete?.[0] ??
        "This job could not be deleted.",
    };
  }

  const deleteResult = await prisma.job.deleteMany({
    where: {
      id: parsedInput.data.jobId,
      userId: user.id,
    },
  });

  if (deleteResult.count === 0) {
    return {
      formError: "This job could not be found.",
    };
  }

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${parsedInput.data.jobId}`);

  redirect("/jobs");
}
