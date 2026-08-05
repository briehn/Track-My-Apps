import Image from "next/image";

import { SignInWithGoogleButton } from "@/features/auth/components/auth-buttons";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[32rem] bg-[linear-gradient(to_right,theme(colors.slate.200/0.55)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.200/0.55)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:linear-gradient(to_bottom,black,transparent)] dark:bg-[linear-gradient(to_right,theme(colors.slate.800/0.7)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.800/0.7)_1px,transparent_1px)]"
      />
      <div className="relative mx-auto w-full max-w-7xl px-5 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-28 lg:px-8 lg:pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
            A job-search workspace for engineers
          </p>
          <h1
            id="hero-heading"
            className="mt-5 text-balance text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-7xl dark:text-white"
          >
            Stop losing your job search to tabs and spreadsheets.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 dark:text-slate-300">
            Track every application, deadline, follow-up, and interview note in
            one private workspace—then prepare with AI grounded in the roles and
            profile you saved.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <SignInWithGoogleButton label="Continue with Google" />
            <a href="#workflow" className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:focus-visible:ring-sky-400 dark:focus-visible:ring-offset-slate-950">See how it works</a>
          </div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Private workspace · Sign in with Google · No password to create
          </p>
        </div>

        <figure className="mx-auto mt-14 max-w-6xl sm:mt-16">
          <div className="overflow-hidden rounded-2xl border border-slate-300 bg-slate-900 p-1 shadow-2xl shadow-slate-950/15 dark:border-slate-700 dark:shadow-black/30">
            <Image
              src="/screenshots/dashboard.png"
              alt="Track My Apps dashboard showing an application pipeline with saved, applied, interviewing, offer, rejected, and archived stages."
              width={1632}
              height={860}
              priority
              className="block h-auto w-full rounded-xl"
              sizes="(min-width: 1280px) 1152px, (min-width: 640px) calc(100vw - 48px), calc(100vw - 40px)"
            />
          </div>
          <figcaption className="mt-3 text-center text-sm text-slate-500 dark:text-slate-400">
            See your active search, pipeline, and next actions at a glance.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
