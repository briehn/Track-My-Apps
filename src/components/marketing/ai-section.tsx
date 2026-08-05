import Image from "next/image";

import { SectionHeading } from "@/components/marketing/section-heading";

const capabilities = [
  "Analyze a saved job description for requirements and signals.",
  "Extract a reviewable profile from your resume text.",
  "Compare your profile to a role and prepare for an interview.",
];

export function AiSection() {
  return (
    <section className="border-y border-slate-800 bg-slate-950 py-20 text-white sm:py-28">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-20 lg:px-8">
        <div>
          <SectionHeading eyebrow="Assistance, with context" title="AI that starts with your real job search." description="Track My Apps keeps the tracker in charge. AI assistance is manual, reviewable, and grounded in the job and profile information you choose to save." />
          <ul className="mt-8 space-y-4 border-t border-slate-800 pt-6">
            {capabilities.map((capability) => (
              <li key={capability} className="flex gap-3 text-sm leading-6 text-slate-300">
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-sky-400" />
                {capability}
              </li>
            ))}
          </ul>
        </div>
        <figure className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-1 shadow-2xl shadow-black/30">
          <Image src="/screenshots/profile_extraction.png" alt="Track My Apps profile extraction workspace with reviewable AI suggestions from a resume." width={1632} height={860} className="h-auto w-full rounded-xl" sizes="(min-width: 1024px) 50vw, calc(100vw - 40px)" />
        </figure>
      </div>
    </section>
  );
}
