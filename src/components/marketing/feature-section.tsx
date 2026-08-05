import { FileSpreadsheet, ListTodo, Sparkles, Upload } from "lucide-react";

import { SectionHeading } from "@/components/marketing/section-heading";

const featureGroups = [
  { icon: ListTodo, title: "Track the search", features: ["Application statuses", "Notes and job details", "Deadlines and follow-ups", "Pipeline visualization"] },
  { icon: Sparkles, title: "Prepare with context", features: ["AI job analysis", "Resume/profile extraction", "Profile-to-job matching", "Interview preparation"] },
  { icon: FileSpreadsheet, title: "Keep your data portable", features: ["CSV export", "Formatted XLSX export", "CSV import preview", "Column mapping and validation"] },
];

export function FeatureSection() {
  return (
    <section id="features" className="scroll-mt-8 bg-white py-20 sm:py-28 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Built for the whole workflow" title="The tools you need, organized around your next move." description="Track My Apps gives each part of the search a clear home without asking you to adopt a complicated system." />
        <div className="mt-12 grid gap-10 border-y border-slate-200 py-8 md:grid-cols-3 dark:border-slate-800">
          {featureGroups.map(({ icon: Icon, title, features }) => (
            <section key={title}>
              <Icon className="size-5 text-sky-700 dark:text-sky-300" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-100">{title}</h3>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
            </section>
          ))}
        </div>
        <div className="mt-8 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
          <Upload className="mt-0.5 size-4 shrink-0 text-sky-700 dark:text-sky-300" aria-hidden="true" />
          <p>Already tracking applications elsewhere? Import a CSV, review the mapping and validation preview, then bring your search into one workspace.</p>
        </div>
      </div>
    </section>
  );
}
