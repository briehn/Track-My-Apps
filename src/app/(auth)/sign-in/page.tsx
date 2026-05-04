import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { SignInWithGoogleButton } from "@/features/auth/components/auth-buttons";
import { authOptions } from "@/features/auth/auth-options";

const highlights = [
  "Track applications in one place",
  "Save job descriptions, statuses, deadlines, and notes",
  "Review your search progress from a dashboard",
  "Keep your search organized for future AI workflows",
];

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Track My Apps
          </p>
          <div className="space-y-4">
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Track your job search in one focused workspace.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
              Save roles, manage application status, keep notes, and prepare
              for future AI-assisted workflows without losing sight of the
              current search.
            </p>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
            {highlights.map((highlight) => (
              <li
                key={highlight}
                className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm"
              >
                {highlight}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Private workspace
            </p>
            <h2 className="text-2xl font-semibold text-slate-950">
              Sign in or get started
            </h2>
            <p className="text-sm leading-6 text-slate-700">
              Use your Google account to open the tracker and keep your saved
              jobs private to your account.
            </p>
          </div>

          <div className="mt-6">
            <SignInWithGoogleButton label="Continue with Google" />
            <p className="mt-3 text-sm leading-6 text-slate-600">
              No password required. Your saved jobs stay private to your
              account.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
