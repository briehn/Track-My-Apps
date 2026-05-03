import Link from "next/link";

import { SignOutButton } from "@/features/auth/components/auth-buttons";

type AppShellProps = Readonly<{
  children: React.ReactNode;
  user: {
    email?: string | null;
    name?: string | null;
  };
}>;

const navigationItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs", label: "Jobs" },
];

export function AppShell({ children, user }: AppShellProps) {
  const displayName = user.name ?? user.email ?? "Signed-in user";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex min-h-16 items-center justify-between gap-4 px-6">
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
        <aside className="border-b border-slate-200 bg-white p-4 md:border-b-0 md:border-r">
          <nav aria-label="Primary navigation" className="flex gap-2 md:block">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
