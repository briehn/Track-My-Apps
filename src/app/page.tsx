import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { SignInWithGoogleButton } from "@/features/auth/components/auth-buttons";
import { authOptions } from "@/features/auth/auth-options";

const featureCards = [
  {
    title: "Track applications in one place",
    description:
      "Save roles manually and keep the company, title, location, and source attached to each job.",
  },
  {
    title: "Manage status, deadlines, and notes",
    description:
      "Move jobs through saved, applied, interviewing, offer, rejected, and archived while keeping follow-ups in view.",
  },
  {
    title: "See your search progress at a glance",
    description:
      "Use the dashboard to review recent jobs, status counts, and upcoming dates without digging through the list.",
  },
  {
    title: "Use grounded AI where it helps",
    description:
      "Run manual AI job analysis, profile extraction, and profile-to-job matching tied to your saved data.",
  },
];

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="bg-slate-50">
      <section className="mx-auto grid min-h-screen w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <Badge variant="info" className="w-fit">
              Public preview
            </Badge>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Track My Apps helps you track every application in one
                place.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
                Save jobs, manage statuses and deadlines, keep notes, and use
                grounded AI analysis and matching features tied to your saved
                data.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <SignInWithGoogleButton label="Continue with Google" />
            <LinkButton href="#features" variant="secondary">
              Learn more
            </LinkButton>
          </div>

          <p className="text-sm leading-6 text-slate-600">
            No password required. Signed-in users go straight to the dashboard.
          </p>
        </div>

        <Card className="space-y-6 p-6 sm:p-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Built for the current search
            </p>
            <h2 className="text-2xl font-semibold text-slate-950">
              A clean tracker with careful AI support
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              The app keeps the tracker workflow primary, then layers AI on top
              only where it is grounded in saved jobs and profile data.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Google OAuth sign-in",
              "Protected dashboard and jobs",
              "Job detail pages and notes",
              "AI analysis and profile match",
            ].map((item) => (
              <div
                key={item}
                className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section
        id="features"
        className="border-t border-slate-200 bg-white px-4 py-16 sm:px-6"
      >
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              What it includes
            </p>
            <h2 className="text-3xl font-semibold text-slate-950">
              Focused workflows for an organized search
            </h2>
            <p className="text-sm leading-6 text-slate-600 sm:text-base">
              The tracker is live, and the current AI features stay deliberately
              narrow, manual, and grounded in user-owned data.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((card) => (
              <Card key={card.title} className="space-y-3 p-5">
                <h3 className="text-base font-semibold text-slate-950">
                  {card.title}
                </h3>
                <p className="text-sm leading-6 text-slate-600">
                  {card.description}
                </p>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-950">
                Planned next layer
              </p>
              <p className="text-sm leading-6 text-slate-600">
                Deeper resume tailoring, interview prep, and richer automation
                are still planned. The current product remains tracker-first.
              </p>
            </div>
            <Link
              href="/sign-in"
              className="text-sm font-medium text-slate-950 underline underline-offset-4 hover:text-slate-700"
            >
              Get started with Google
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
