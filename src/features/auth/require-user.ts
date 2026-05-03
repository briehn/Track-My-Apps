import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/features/auth/auth-options";

export async function requireUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return session.user;
}
