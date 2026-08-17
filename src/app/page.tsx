import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AiSection } from "@/components/marketing/ai-section";
import { FeatureSection } from "@/components/marketing/feature-section";
import { Hero } from "@/components/marketing/hero";
import { LandingFooter } from "@/components/marketing/landing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { ProblemPayoff } from "@/components/marketing/problem-payoff";
import { ProductShowcase } from "@/components/marketing/product-showcase";
import { WorkflowSection } from "@/components/marketing/workflow-section";
import { auth } from "@/features/auth/auth";

export const metadata: Metadata = {
  title: "Track My Apps | Job application tracker for software engineers",
  description: "Track job applications, deadlines, follow-ups, notes, and AI-assisted interview preparation in one private workspace.",
  alternates: { canonical: "https://trackmyapps.dev/" },
};

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-slate-950 focus:shadow-lg">Skip to content</a>
      <MarketingHeader />
      <main id="main-content">
        <Hero />
        <ProblemPayoff />
        <WorkflowSection />
        <ProductShowcase />
        <AiSection />
        <FeatureSection />
      </main>
      <LandingFooter />
    </>
  );
}
