"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SignOutButton } from "@/features/auth/components/auth-buttons";

type AppShellProps = Readonly<{
  children: React.ReactNode;
  initialThemePreference: "light" | "dark" | "system";
  user: {
    email?: string | null;
    name?: string | null;
  };
}>;

export function AppShell({ children, initialThemePreference, user }: AppShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const displayName = user.name ?? user.email ?? "Signed-in user";
  const statusQuery = searchParams.get("status");
  const isJobsRoute = pathname === "/jobs" || pathname.startsWith("/jobs/");
  const isArchivedView = pathname === "/jobs" && statusQuery === "archived";
  const isActiveJobsView = pathname === "/jobs" && !isArchivedView;
  const showArchivedNav = isJobsRoute || isMobileMenuOpen;
  const isProfileView = pathname === "/profile";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-950/90">
        <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-950">
              TM
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight text-slate-950 dark:text-slate-100">
                Track My Apps
              </p>
              <p className="max-w-[12rem] truncate text-xs text-slate-500 dark:text-slate-400 sm:max-w-none">{displayName}</p>
            </div>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle initialThemePreference={initialThemePreference} />
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              Private workspace
            </div>
            <SignOutButton />
          </div>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((value) => !value)}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav-menu"
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 md:hidden"
          >
            {isMobileMenuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </header>
      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu overlay"
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute inset-0 bg-slate-950/40"
          />
          <aside
            id="mobile-nav-menu"
            aria-label="Mobile navigation"
            className="absolute right-0 top-0 h-full w-72 border-l border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-950"
          >
            <nav className="space-y-2">
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-current={pathname === "/dashboard" ? "page" : undefined}
                className={[
                  "block rounded-md px-3 py-2 text-sm font-medium transition",
                  pathname === "/dashboard"
                    ? "bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
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
                      ? "bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950"
                      : isJobsRoute
                        ? "text-slate-950 dark:text-slate-100"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                  ].join(" ")}
                >
                  Jobs
                </Link>

                {showArchivedNav ? (
                  <div className="ml-3 border-l border-slate-200 pl-3 dark:border-slate-700">
                    <Link
                      href="/jobs?status=archived"
                      onClick={() => setIsMobileMenuOpen(false)}
                      aria-current={isArchivedView ? "page" : undefined}
                      className={[
                        "block rounded-md px-3 py-2 text-sm font-medium transition",
                        isArchivedView
                          ? "bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                      ].join(" ")}
                    >
                      Archived
                    </Link>
                  </div>
                ) : null}
              </div>

              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-current={isProfileView ? "page" : undefined}
                className={[
                  "block rounded-md px-3 py-2 text-sm font-medium transition",
                  isProfileView
                  ? "bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                ].join(" ")}
              >
                Profile
              </Link>
            </nav>
            <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
              <ThemeToggle initialThemePreference={initialThemePreference} />
              <SignOutButton className="w-full" />
            </div>
          </aside>
        </div>
      ) : null}
      <div className="grid min-h-[calc(100vh-4rem)] md:grid-cols-[16rem_1fr]">
        <aside className="hidden border-b border-slate-200 bg-white p-3 sm:p-4 md:block md:border-b-0 md:border-r dark:border-slate-700 dark:bg-slate-950">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Workspace
          </p>
          <nav
            aria-label="Primary navigation"
            className="space-y-2"
          >
            <Link
              href="/dashboard"
              aria-current={pathname === "/dashboard" ? "page" : undefined}
              className={[
                "block rounded-lg px-3 py-2 text-sm font-medium transition",
                pathname === "/dashboard"
                  ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-950"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
              ].join(" ")}
            >
              Dashboard
            </Link>

            <div className="mt-2 space-y-1">
              <Link
                href="/jobs"
                aria-current={isActiveJobsView ? "page" : undefined}
                className={[
                    "block rounded-lg px-3 py-2 text-sm font-medium transition",
                  isActiveJobsView
                    ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-950"
                    : isJobsRoute
                      ? "text-slate-950 dark:text-slate-100"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                ].join(" ")}
              >
                Jobs
              </Link>

              {showArchivedNav ? (
                <div className="ml-3 border-l border-slate-200 pl-3 dark:border-slate-700">
                  <Link
                    href="/jobs?status=archived"
                    aria-current={isArchivedView ? "page" : undefined}
                    className={[
                      "block rounded-lg px-3 py-2 text-sm font-medium transition",
                      isArchivedView
                        ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-950"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                    ].join(" ")}
                  >
                    Archived
                  </Link>
                </div>
              ) : null}
            </div>

            <Link
              href="/profile"
              aria-current={isProfileView ? "page" : undefined}
              className={[
                "mt-2 block rounded-lg px-3 py-2 text-sm font-medium transition",
                isProfileView
                  ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-950"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
              ].join(" ")}
            >
              Profile
            </Link>

          </nav>
        </aside>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
