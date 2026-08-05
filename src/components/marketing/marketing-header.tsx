import Image from "next/image";
import Link from "next/link";

import { SignInWithGoogleButton } from "@/features/auth/components/auth-buttons";

export function MarketingHeader() {
  return (
    <header className="border-b border-slate-200/80 bg-slate-50/95 dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-sky-400 dark:focus-visible:ring-offset-slate-950"
          aria-label="Track My Apps home"
        >
          <span className="inline-flex size-8 overflow-hidden rounded-lg border border-slate-200 bg-slate-900 dark:border-slate-700 dark:bg-slate-100">
            <Image
              src="/screenshots/icon.png"
              alt=""
              width={32}
              height={32}
              className="size-full object-cover"
              priority
            />
          </span>
          <span className="text-sm font-semibold tracking-tight text-slate-950 dark:text-slate-100">
            Track My Apps
          </span>
        </Link>

        <nav aria-label="Landing page navigation" className="hidden items-center gap-6 md:flex">
          <a href="#workflow" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:text-slate-300 dark:hover:text-white dark:focus-visible:ring-sky-400 dark:focus-visible:ring-offset-slate-950">How it works</a>
          <a href="#features" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:text-slate-300 dark:hover:text-white dark:focus-visible:ring-sky-400 dark:focus-visible:ring-offset-slate-950">Features</a>
        </nav>

        <SignInWithGoogleButton label="Continue with Google" />
      </div>
    </header>
  );
}
