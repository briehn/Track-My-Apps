import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Track My Apps",
  description: "A job application tracker with an AI-ready data foundation.",
  icons: {
    icon: "/screenshots/icon.png",
    apple: "/screenshots/icon.png",
    shortcut: "/screenshots/icon.png",
  },
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function RootLayout({ children }: RootLayoutProps) {
  const cookieStore = await cookies();
  const savedTheme = cookieStore.get("theme")?.value;
  const hasManualTheme = savedTheme === "light" || savedTheme === "dark";
  const rootClassName = hasManualTheme
    ? savedTheme === "dark"
      ? "dark"
      : ""
    : "theme-system";
  const rootTheme = hasManualTheme ? savedTheme : "system";

  return (
    <html
      lang="en"
      className={rootClassName}
      data-theme={rootTheme}
      suppressHydrationWarning
    >
      <body>
        {children}
      </body>
    </html>
  );
}
