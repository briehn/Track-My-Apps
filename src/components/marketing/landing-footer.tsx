import Image from "next/image";
import Link from "next/link";

import { SignInWithGoogleButton } from "@/features/auth/components/auth-buttons";

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
      <section className="border-b border-slate-200 py-20 dark:border-slate-800 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">Start with the next role</p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-5xl dark:text-white">Get your search out of the spreadsheet.</h2>
          <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">Sign in with Google and start building a clearer view of your applications.</p>
          <div className="mt-8 flex justify-center"><SignInWithGoogleButton label="Continue with Google" /></div>
        </div>
      </section>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex w-fit items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-sky-400 dark:focus-visible:ring-offset-slate-950">
          <span className="inline-flex size-7 overflow-hidden rounded-md border border-slate-200 bg-slate-900 dark:border-slate-700 dark:bg-slate-100"><Image src="/screenshots/icon.png" alt="" width={28} height={28} className="size-full object-cover" /></span>
          <span className="text-sm font-semibold tracking-tight text-slate-950 dark:text-slate-100">Track My Apps</span>
        </Link>
        <p className="text-sm text-slate-500 dark:text-slate-400">A private workspace for your job search.</p>
      </div>
    </footer>
  );
}
