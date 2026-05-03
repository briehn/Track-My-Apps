"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

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
  const displayName = user.name ?? user.email ?? "Signed-in user";
  const isJobsRoute = pathname === "/jobs" || pathname.startsWith("/jobs/");
  const isArchivedView =
    pathname === "/jobs" && searchParams.get("status") === "archived";
  const isActiveJobsView = pathname === "/jobs" && !isArchivedView;
  const showArchivedNav = isJobsRoute;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-slate-950">
              AI Job Search Copilot
            </p>
            <p className="text-xs text-slate-500">{displayName}</p>
          </div>
          <SignOutButton />
        </div>
      </header>
      <div className="grid min-h-[calc(100vh-4rem)] md:grid-cols-[15rem_1fr]">
        <aside className="border-b border-slate-200 bg-white p-3 sm:p-4 md:border-b-0 md:border-r">
          <nav
            aria-label="Primary navigation"
            className="flex flex-wrap gap-2 md:block"
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
              aria-current={pathname === "/jobs/new" ? "page" : undefined}
              className={[
                "mt-2 block rounded-md px-3 py-2 text-sm font-medium transition",
                pathname === "/jobs/new"
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
