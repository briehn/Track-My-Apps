import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

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
  const rootTheme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
  const rootClassName = rootTheme === "dark" ? "dark" : "";

  return (
    <html
      lang="en"
      className={cn(rootClassName, "font-sans", inter.variable)}
      data-theme={rootTheme}
      suppressHydrationWarning
    >
      <body>
        {children}
      </body>
    </html>
  );
}
