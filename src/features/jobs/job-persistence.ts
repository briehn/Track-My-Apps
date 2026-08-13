import { createJobSchema, type CreateJobInput } from "@/features/jobs/schemas";
import { prisma } from "@/server/db/prisma";

export type CreateJobForUserResult =
  | { data: CreateJobInput; success: true }
  | {
      fieldErrors: Partial<Record<keyof CreateJobInput, string[]>>;
      success: false;
    };

export async function createJobForUser(
  userId: string,
  input: unknown,
): Promise<CreateJobForUserResult> {
  const parsedInput = createJobSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      fieldErrors: parsedInput.error.flatten().fieldErrors,
      success: false,
    };
  }

  await prisma.job.create({
    data: {
      ...parsedInput.data,
      userId,
    },
  });

  return { data: parsedInput.data, success: true };
}
