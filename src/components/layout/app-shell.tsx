"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

import { SignOutButton } from "@/features/auth/components/auth-buttons";

type AppShellProps = Readonly<{
  children: React.ReactNode;
  user: {
    email?: string | null;
    name?: string | null;
  };
}>;

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const displayName = user.name ?? user.email ?? "Signed-in user";
  const statusQuery = searchParams.get("status");
  const isJobsRoute = pathname === "/jobs" || pathname.startsWith("/jobs/");
  const isArchivedView = pathname === "/jobs" && statusQuery === "archived";
  const isActiveJobsView = pathname === "/jobs" && !isArchivedView;
  const showArchivedNav = isJobsRoute || isMobileMenuOpen;
  const isAddJobView = pathname === "/jobs/new";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-slate-950">
              Track My Apps
            </p>
            <p className="text-xs text-slate-500">{displayName}</p>
          </div>
          <div className="hidden md:block">
            <SignOutButton />
          </div>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((value) => !value)}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav-menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 text-slate-900 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 md:hidden"
          >
            <span className="text-lg leading-none">{isMobileMenuOpen ? "x" : "="}</span>
          </button>
        </div>
      </header>
      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu overlay"
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute inset-0 bg-slate-950/20"
          />
          <aside
            id="mobile-nav-menu"
            aria-label="Mobile navigation"
            className="absolute right-0 top-0 h-full w-72 border-l border-slate-200 bg-white p-4 shadow-xl"
          >
            <nav className="space-y-2">
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-current={pathname === "/dashboard" ? "page" : undefined}
                className={[
                  "block rounded-md px-3 py-2 text-sm font-medium transition",
                  pathname === "/dashboard"
                    ? "bg-slate-950 text-white"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
                ].join(" ")}
              >
                Dashboard
              </Link>

              <div className="space-y-1">
                <Link
                  href="/jobs"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-current={isActiveJobsView ? "page" : undefined}
                  className={[
                    "block rounded-md px-3 py-2 text-sm font-medium transition",
                    isActiveJobsView
                      ? "bg-slate-950 text-white"
                      : isJobsRoute
                        ? "text-slate-950"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
                  ].join(" ")}
                >
                  Jobs
                </Link>

                {showArchivedNav ? (
                  <div className="ml-3 border-l border-slate-200 pl-3">
                    <Link
                      href="/jobs?status=archived"
                      onClick={() => setIsMobileMenuOpen(false)}
                      aria-current={isArchivedView ? "page" : undefined}
                      className={[
                        "block rounded-md px-3 py-2 text-sm font-medium transition",
                        isArchivedView
                          ? "bg-slate-950 text-white"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
                      ].join(" ")}
                    >
                      Archived
                    </Link>
                  </div>
                ) : null}
              </div>

              <Link
                href="/jobs/new"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-current={isAddJobView ? "page" : undefined}
                className={[
                  "block rounded-md px-3 py-2 text-sm font-medium transition",
                  isAddJobView
                    ? "bg-slate-950 text-white"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
                ].join(" ")}
              >
                Add Job
              </Link>
            </nav>
            <div className="mt-4 border-t border-slate-200 pt-4">
              <SignOutButton className="w-full" />
            </div>
          </aside>
        </div>
      ) : null}
      <div className="grid min-h-[calc(100vh-4rem)] md:grid-cols-[15rem_1fr]">
        <aside className="hidden border-b border-slate-200 bg-white p-3 sm:p-4 md:block md:border-b-0 md:border-r">
          <nav
            aria-label="Primary navigation"
            className="space-y-2"
          >
            <Link
              href="/dashboard"
              aria-current={pathname === "/dashboard" ? "page" : undefined}
              className={[
                "block rounded-md px-3 py-2 text-sm font-medium transition",
                pathname === "/dashboard"
                  ? "bg-slate-950 text-white"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
              ].join(" ")}
            >
              Dashboard
            </Link>

            <div className="mt-2 space-y-1">
              <Link
                href="/jobs"
                aria-current={isActiveJobsView ? "page" : undefined}
                className={[
                  "block rounded-md px-3 py-2 text-sm font-medium transition",
                  isActiveJobsView
                    ? "bg-slate-950 text-white"
                    : isJobsRoute
                      ? "text-slate-950"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
                ].join(" ")}
              >
                Jobs
              </Link>

              {showArchivedNav ? (
                <div className="ml-3 border-l border-slate-200 pl-3">
                  <Link
                    href="/jobs?status=archived"
                    aria-current={isArchivedView ? "page" : undefined}
                    className={[
                      "block rounded-md px-3 py-2 text-sm font-medium transition",
                      isArchivedView
                        ? "bg-slate-950 text-white"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
                    ].join(" ")}
                  >
                    Archived
                  </Link>
                </div>
              ) : null}
            </div>

            <Link
                href="/jobs/new"
              aria-current={isAddJobView ? "page" : undefined}
              className={[
                "mt-2 block rounded-md px-3 py-2 text-sm font-medium transition",
                isAddJobView
                  ? "bg-slate-950 text-white"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
              ].join(" ")}
            >
              Add Job
            </Link>
          </nav>
        </aside>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
