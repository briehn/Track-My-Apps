import { ArrowRight } from "lucide-react";

import { SectionHeading } from "@/components/marketing/section-heading";

const comparisons = [
  ["Saved links without context", "Every role has status, notes, and key dates"],
  ["Deadlines and follow-ups easy to miss", "Your next actions stay visible"],
  ["Resume details separated from job research", "Preparation starts from saved job and profile context"],
];

export function ProblemPayoff() {
  return (
    <section className="bg-white py-20 sm:py-28 dark:bg-slate-950">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-20 lg:px-8">
        <SectionHeading
          eyebrow="Built around the real search"
          title="Your search needs a system, not another spreadsheet."
          description="Track My Apps turns scattered application details into a clear workflow you can return to every day."
        />
        <dl className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {comparisons.map(([before, after]) => (
            <div key={before} className="grid gap-3 py-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-5">
              <dt className="text-sm leading-6 text-slate-500 dark:text-slate-400">{before}</dt>
              <ArrowRight className="size-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />
              <dd className="text-sm font-medium leading-6 text-slate-950 dark:text-slate-100">{after}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
