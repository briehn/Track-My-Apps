import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/features/auth/require-user";
import { cookies } from "next/headers";

type DashboardLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

type ThemePreference = "light" | "dark" | "system";

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await requireUser();
  const cookieStore = await cookies();
  const savedTheme = cookieStore.get("theme")?.value;
  const initialThemePreference: ThemePreference =
    savedTheme === "light" || savedTheme === "dark" ? savedTheme : "system";

  return (
    <AppShell user={user} initialThemePreference={initialThemePreference}>
      {children}
    </AppShell>
  );
}
