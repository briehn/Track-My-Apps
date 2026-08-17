import { redirect } from "next/navigation";

import { auth } from "@/features/auth/auth";

export async function requireUser() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return session.user;
}
