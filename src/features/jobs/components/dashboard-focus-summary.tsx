import Link from "next/link";
import {
  CalendarClock,
  Clock3,
  MessageSquareText,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import type { TodayFocusSummary } from "@/features/jobs/dashboard-focus";
import { statusLabels } from "@/features/jobs/status";

type FocusBucket = TodayFocusSummary[keyof TodayFocusSummary];

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
});

type FocusPanelProps = {
  title: string;
  countLabel: (count: number) => string;
  emptyLabel: string;
  bucket: FocusBucket;
  icon: LucideIcon;
  iconClassName: string;
  getDetail: (job: FocusBucket["jobs"][number]) => string;
};

function FocusPanel({
  title,
  countLabel,
  emptyLabel,
  bucket,
  icon: Icon,
  iconClassName,
  getDetail,
}: FocusPanelProps) {
  return (
    <section className="rounded-2xl bg-slate-100/75 p-4 dark:bg-slate-900/55">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={["inline-flex size-8 shrink-0 items-center justify-center rounded-lg", iconClassName].join(" ")}>
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        </div>
        <span className="pt-1 text-sm font-semibold tabular-nums text-slate-950 dark:text-white">
          {bucket.count}
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {bucket.count > 0 ? countLabel(bucket.count) : emptyLabel}
      </p>
      {bucket.jobs.length > 0 ? (
        <div className="mt-3 divide-y divide-slate-200/80 dark:divide-slate-800">
          {bucket.jobs.slice(0, 2).map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="block rounded-md py-2 transition-colors first:pt-0 last:pb-0 hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:hover:bg-slate-800/70 dark:focus-visible:ring-sky-400 dark:focus-visible:ring-offset-slate-950"
            >
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{job.title}</p>
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{getDetail(job)}</p>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function DashboardFocusSummary({ focus }: { focus: TodayFocusSummary }) {
  return (
    <section aria-labelledby="todays-focus-heading" className="space-y-3">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 id="todays-focus-heading" className="text-base font-semibold tracking-tight text-slate-950 dark:text-slate-100">
            Today&apos;s Focus
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Priority actions for your active search.</p>
        </div>
      </div>
      <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-4">
        <FocusPanel
          title="Follow-ups due"
          bucket={focus.followUpsDue}
          countLabel={(count) => `${count} ${count === 1 ? "role needs" : "roles need"} attention.`}
          emptyLabel="Nothing due today."
          icon={Clock3}
          iconClassName="bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"
          getDetail={(job) => `${job.company} · Follow up ${job.followUpAt ? dateFormatter.format(job.followUpAt) : "today"}`}
        />
        <FocusPanel
          title="Upcoming deadlines"
          bucket={focus.upcomingDeadlines}
          countLabel={(count) => `${count} ${count === 1 ? "deadline" : "deadlines"} in the next 7 days.`}
          emptyLabel="No deadlines this week."
          icon={CalendarClock}
          iconClassName="bg-sky-100 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300"
          getDetail={(job) => `${job.company} · Due ${job.deadline ? dateFormatter.format(job.deadline) : "soon"}`}
        />
        <FocusPanel
          title="Missing analysis"
          bucket={focus.missingAnalysis}
          countLabel={(count) => `${count} active ${count === 1 ? "role" : "roles"} without analysis.`}
          emptyLabel="All active roles have analysis."
          icon={Sparkles}
          iconClassName="bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300"
          getDetail={(job) => job.company}
        />
        <FocusPanel
          title="Interview prep"
          bucket={focus.interviewPrepOpportunities}
          countLabel={(count) => `${count} ${count === 1 ? "role is" : "roles are"} ready for prep.`}
          emptyLabel="No prep opportunities yet."
          icon={MessageSquareText}
          iconClassName="bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
          getDetail={(job) => `${job.company} · ${statusLabels[job.status]}`}
        />
      </div>
    </section>
  );
}
