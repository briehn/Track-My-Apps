import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Track My Apps",
  description: "A job application tracker with an AI-ready data foundation.",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
