import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { SignInWithGoogleButton } from "@/features/auth/components/auth-buttons";
import { authOptions } from "@/features/auth/auth-options";

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16">
      <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
          AI Job Search Copilot
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">Sign in</h1>
        <p className="mt-4 text-base leading-7 text-slate-700">
          Use Google to access your private job search tracker.
        </p>
        <div className="mt-8">
          <SignInWithGoogleButton />
        </div>
      </div>
    </main>
  );
}
