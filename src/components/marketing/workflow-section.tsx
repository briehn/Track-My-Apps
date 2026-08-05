import Image from "next/image";

import { SectionHeading } from "@/components/marketing/section-heading";

const workflowSteps = [
  {
    number: "01",
    title: "Capture the role",
    description: "Save a posting with the details that matter before it disappears into another browser tab.",
    image: "/screenshots/jobs-list.png",
    alt: "Track My Apps jobs list showing saved applications.",
  },
  {
    number: "02",
    title: "Keep momentum",
    description: "Move applications through your pipeline and keep deadlines, follow-ups, and notes connected to each role.",
    image: "/screenshots/dashboard.png",
    alt: "Track My Apps dashboard showing the application pipeline.",
  },
  {
    number: "03",
    title: "Prepare with context",
    description: "Use job analysis, profile matching, and interview prep only when the saved information can make them useful.",
    image: "/screenshots/job-detail.png",
    alt: "Track My Apps job detail page with AI insights tabs.",
  },
];

export function WorkflowSection() {
  return (
    <section id="workflow" className="scroll-mt-8 border-y border-slate-200 bg-slate-50 py-20 sm:py-28 dark:border-slate-800 dark:bg-slate-900/35">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="One place for the work behind every application."
          description="Start with a role. Keep the next step clear. Bring in assistance when you are ready to prepare."
          align="center"
        />
        <ol className="mt-12 grid gap-10 md:grid-cols-3">
          {workflowSteps.map((step) => (
            <li key={step.number}>
              <p className="text-xs font-semibold tracking-[0.18em] text-sky-700 dark:text-sky-300">{step.number}</p>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.description}</p>
              <div className="mt-5 overflow-hidden rounded-xl border border-slate-300 bg-slate-950 p-1 shadow-lg shadow-slate-950/10 dark:border-slate-700 dark:shadow-black/20">
                <Image src={step.image} alt={step.alt} width={1632} height={860} className="aspect-[16/9] w-full rounded-lg object-cover object-top" sizes="(min-width: 768px) 33vw, calc(100vw - 40px)" />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
