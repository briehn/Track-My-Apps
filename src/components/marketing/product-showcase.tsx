import Image from "next/image";
import { CalendarDays, ListChecks, NotebookPen } from "lucide-react";

import { SectionHeading } from "@/components/marketing/section-heading";

const outcomes = [
  { icon: ListChecks, title: "Know each role’s status", description: "Saved, applied, interviewing, offer, rejected, or archived—without maintaining formulas." },
  { icon: CalendarDays, title: "Protect the next step", description: "Keep application deadlines and follow-up dates attached to the job they belong to." },
  { icon: NotebookPen, title: "Keep the useful context", description: "Store notes from recruiter calls, interviews, and your own research with the role." },
];

export function ProductShowcase() {
  return (
    <section className="bg-white py-20 sm:py-28 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-end lg:gap-20">
          <SectionHeading eyebrow="Your search at a glance" title="See the work that deserves your attention." description="A visual pipeline makes it easier to understand where your search stands without turning it into another full-time project." />
          <div className="grid gap-6 sm:grid-cols-3">
            {outcomes.map(({ icon: Icon, title, description }) => (
              <div key={title}>
                <Icon className="size-5 text-sky-700 dark:text-sky-300" aria-hidden="true" />
                <h3 className="mt-4 text-sm font-semibold text-slate-950 dark:text-slate-100">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
              </div>
            ))}
          </div>
        </div>
        <figure className="mt-12 overflow-hidden rounded-2xl border border-slate-300 bg-slate-900 p-1 shadow-xl shadow-slate-950/10 dark:border-slate-700 dark:shadow-black/20">
          <Image src="/screenshots/dashboard.png" alt="Track My Apps dashboard with a visual application pipeline and active job summary." width={1632} height={860} className="h-auto w-full rounded-xl" sizes="(min-width: 1280px) 1152px, calc(100vw - 40px)" />
        </figure>
      </div>
    </section>
  );
}
