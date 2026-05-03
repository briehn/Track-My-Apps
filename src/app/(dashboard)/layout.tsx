import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/features/auth/require-user";

type DashboardLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await requireUser();

  return <AppShell user={user}>{children}</AppShell>;
}
