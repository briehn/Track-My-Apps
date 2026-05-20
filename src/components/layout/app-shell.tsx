"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import {
  Archive,
  BriefcaseBusiness,
  CircleDot,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
} from "lucide-react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SignOutButton } from "@/features/auth/components/auth-buttons";

type AppShellProps = Readonly<{
  children: React.ReactNode;
  initialThemePreference: "light" | "dark";
  user: {
    email?: string | null;
    name?: string | null;
  };
}>;

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";
const SIDEBAR_COLLAPSED_EVENT = "sidebar-collapsed-change";

function getSidebarCollapsedSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
}

function subscribeSidebarCollapsed(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === SIDEBAR_COLLAPSED_KEY || event.key === null) {
      onStoreChange();
    }
  };
  const handleLocalChange = () => onStoreChange();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SIDEBAR_COLLAPSED_EVENT, handleLocalChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SIDEBAR_COLLAPSED_EVENT, handleLocalChange);
  };
}

export function AppShell({ children, initialThemePreference, user }: AppShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isSidebarCollapsed = useSyncExternalStore(
    subscribeSidebarCollapsed,
    getSidebarCollapsedSnapshot,
    () => false,
  );
  const displayName = user.name ?? user.email ?? "Signed-in user";
  const statusQuery = searchParams.get("status");
  const isJobsRoute = pathname === "/jobs" || pathname.startsWith("/jobs/");
  const isArchivedView = pathname === "/jobs" && statusQuery === "archived";
  const isActiveJobsView = pathname === "/jobs" && !isArchivedView;
  const showJobsSubNav = isJobsRoute || isMobileMenuOpen;
  const isProfileView = pathname === "/profile";
  const desktopSidebarWidthClass = isSidebarCollapsed
    ? "md:grid-cols-[4.5rem_1fr]"
    : "md:grid-cols-[16rem_1fr]";

  function handleSidebarToggle() {
    const nextValue = !isSidebarCollapsed;
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(nextValue));
    window.dispatchEvent(new Event(SIDEBAR_COLLAPSED_EVENT));
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-950/90">
        <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:focus:ring-slate-500"
            aria-label="Go to dashboard"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-slate-900 dark:bg-slate-100">
              <Image
                src="/screenshots/icon.png"
                alt="Track My Apps logo"
                width={32}
                height={32}
                className="h-full w-full object-cover"
                priority
              />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight text-slate-950 dark:text-slate-100">
                Track My Apps
              </p>
              <p className="max-w-[12rem] truncate text-xs text-slate-500 dark:text-slate-400 sm:max-w-none">{displayName}</p>
            </div>
          </Link>
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
                  className={[
                    "block rounded-md px-3 py-2 text-sm font-medium transition",
                    isJobsRoute
                      ? "text-slate-950 dark:text-slate-100"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                  ].join(" ")}
                >
                  Jobs
                </Link>

                {showJobsSubNav ? (
                  <div className="ml-3 border-l border-slate-200 pl-3 dark:border-slate-700">
                    <Link
                      href="/jobs"
                      onClick={() => setIsMobileMenuOpen(false)}
                      aria-current={isActiveJobsView ? "page" : undefined}
                      className={[
                        "block rounded-md px-3 py-2 text-sm font-medium transition",
                        isActiveJobsView
                          ? "bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                      ].join(" ")}
                    >
                      Active
                    </Link>

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
      <div className={`grid min-h-[calc(100vh-4rem)] ${desktopSidebarWidthClass}`}>
        <aside className="hidden border-b border-slate-200 bg-white p-3 sm:p-4 md:block md:border-b-0 md:border-r dark:border-slate-700 dark:bg-slate-950">
          <div className="mb-2 flex items-center justify-between px-1">
            {!isSidebarCollapsed ? (
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Workspace
              </p>
            ) : (
              <span className="sr-only">Workspace navigation</span>
            )}
            <button
              type="button"
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={handleSidebarToggle}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
              ) : (
                <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
          <nav
            aria-label="Primary navigation"
            className="space-y-2"
          >
            <Link
              href="/dashboard"
              aria-label="Dashboard"
              title="Dashboard"
              aria-current={pathname === "/dashboard" ? "page" : undefined}
              className={[
                "block rounded-lg py-2 text-sm font-medium transition",
                isSidebarCollapsed ? "px-2 text-center" : "px-3",
                pathname === "/dashboard"
                  ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-950"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
              ].join(" ")}
            >
              <span className="inline-flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className={isSidebarCollapsed ? "sr-only" : undefined}>Dashboard</span>
              </span>
            </Link>

            <div className="mt-2 space-y-1">
              <Link
                href="/jobs"
                aria-label="Jobs"
                title="Jobs"
                className={[
                  "block rounded-lg py-2 text-sm font-medium transition",
                  isSidebarCollapsed ? "px-2 text-center" : "px-3",
                  isJobsRoute
                    ? "text-slate-950 dark:text-slate-100"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                ].join(" ")}
              >
                <span className="inline-flex items-center gap-2">
                  <BriefcaseBusiness className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className={isSidebarCollapsed ? "sr-only" : undefined}>Jobs</span>
                </span>
              </Link>

              {showJobsSubNav ? (
                <div
                  className={[
                    "border-slate-200 dark:border-slate-700",
                    isSidebarCollapsed ? "space-y-1" : "ml-3 border-l pl-3",
                  ].join(" ")}
                >
                  <Link
                    href="/jobs"
                    aria-label="Active jobs"
                    title="Active jobs"
                    aria-current={isActiveJobsView ? "page" : undefined}
                    className={[
                      "block rounded-lg py-2 text-sm font-medium transition",
                      isSidebarCollapsed ? "px-2 text-center" : "px-3",
                      isActiveJobsView
                        ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-950"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                    ].join(" ")}
                  >
                    <span className="inline-flex items-center gap-2">
                      <CircleDot className="h-5 w-5 shrink-0" aria-hidden="true" />
                      <span className={isSidebarCollapsed ? "sr-only" : undefined}>Active</span>
                    </span>
                  </Link>

                  <Link
                    href="/jobs?status=archived"
                    aria-label="Archived jobs"
                    title="Archived jobs"
                    aria-current={isArchivedView ? "page" : undefined}
                    className={[
                      "block rounded-lg py-2 text-sm font-medium transition",
                      isSidebarCollapsed ? "px-2 text-center" : "px-3",
                      isArchivedView
                        ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-950"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                    ].join(" ")}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Archive className="h-5 w-5 shrink-0" aria-hidden="true" />
                      <span className={isSidebarCollapsed ? "sr-only" : undefined}>Archived</span>
                    </span>
                  </Link>
                </div>
              ) : null}
            </div>

            <Link
              href="/profile"
              aria-label="Profile"
              title="Profile"
              aria-current={isProfileView ? "page" : undefined}
              className={[
                "mt-2 block rounded-lg py-2 text-sm font-medium transition",
                isSidebarCollapsed ? "px-2 text-center" : "px-3",
                isProfileView
                  ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-950"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
              ].join(" ")}
            >
              <span className="inline-flex items-center gap-2">
                <UserRound className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className={isSidebarCollapsed ? "sr-only" : undefined}>Profile</span>
              </span>
            </Link>
          </nav>
        </aside>
        <main className="min-w-0 overflow-x-hidden p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
