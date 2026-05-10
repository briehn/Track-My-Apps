import { Fragment } from "react";

import { LinkButton } from "@/components/ui/link-button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ApplicationStatus,
  statusLabels,
} from "@/features/jobs/status";

const primaryStages = ["SAVED", "APPLIED", "INTERVIEWING", "OFFER"] as const;
const secondaryStages = ["REJECTED", "ARCHIVED"] as const;

const stageAccentClasses: Record<
  ApplicationStatus,
  {
    dot: string;
    meter: string;
  }
> = {
  SAVED: {
    dot: "bg-slate-500 dark:bg-slate-300",
    meter: "bg-slate-500 dark:bg-slate-300",
  },
  APPLIED: {
    dot: "bg-sky-500 dark:bg-sky-400",
    meter: "bg-sky-500 dark:bg-sky-400",
  },
  INTERVIEWING: {
    dot: "bg-amber-500 dark:bg-amber-400",
    meter: "bg-amber-500 dark:bg-amber-400",
  },
  OFFER: {
    dot: "bg-emerald-500 dark:bg-emerald-400",
    meter: "bg-emerald-500 dark:bg-emerald-400",
  },
  REJECTED: {
    dot: "bg-rose-500 dark:bg-rose-400",
    meter: "bg-rose-500 dark:bg-rose-400",
  },
  ARCHIVED: {
    dot: "bg-slate-400 dark:bg-slate-500",
    meter: "bg-slate-400 dark:bg-slate-500",
  },
};

type ApplicationPipelineProps = {
  activeTotal: number;
  statusCounts: Record<ApplicationStatus, number>;
};

type StageCardProps = {
  status: ApplicationStatus;
  count: number;
  maxCount: number;
  totalTracked: number;
  compact?: boolean;
};

function getStageMeterWidth(count: number, maxCount: number) {
  if (count === 0 || maxCount === 0) {
    return "0%";
  }

  return `${Math.max((count / maxCount) * 100, 12)}%`;
}

function formatShare(count: number, totalTracked: number) {
  if (totalTracked === 0) {
    return "No roles yet";
  }

  const percentage = Math.round((count / totalTracked) * 100);

  return `${percentage}% of tracked roles`;
}

function StageCard({
  status,
  count,
  maxCount,
  totalTracked,
  compact = false,
}: StageCardProps) {
  const accents = stageAccentClasses[status];
  const isArchived = status === "ARCHIVED";

  return (
    <div
      className={[
        "min-w-0 rounded-2xl border bg-white/90 p-4 shadow-sm transition dark:bg-slate-900/80",
        compact ? "h-full" : "flex-1",
        isArchived
          ? "border-dashed border-slate-300 dark:border-slate-600"
          : "border-slate-200 dark:border-slate-700",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={["h-2.5 w-2.5 rounded-full", accents.dot].join(" ")} />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {statusLabels[status]}
            </p>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
            {count}
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
          {count === 1 ? "1 role" : `${count} roles`}
        </div>
      </div>

      <div className="mt-4">
        <div className="h-2 rounded-full bg-slate-200/80 dark:bg-slate-800">
          <div
            className={["h-2 rounded-full transition-[width]", accents.meter].join(" ")}
            style={{ width: getStageMeterWidth(count, maxCount) }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {formatShare(count, totalTracked)}
        </p>
      </div>
    </div>
  );
}

function SummaryChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
      {label}: {value}
    </div>
  );
}

function DesktopPipeline({
  statusCounts,
  maxCount,
  totalTracked,
}: ApplicationPipelineProps & { maxCount: number; totalTracked: number }) {
  return (
    <div className="hidden md:block">
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/40">
        <div className="flex items-stretch gap-3">
          {primaryStages.map((status, index) => (
            <Fragment key={status}>
              <StageCard
                status={status}
                count={statusCounts[status]}
                maxCount={maxCount}
                totalTracked={totalTracked}
              />
              {index < primaryStages.length - 1 ? (
                <div className="flex w-8 shrink-0 items-center justify-center">
                  <div className="h-px w-full bg-gradient-to-r from-slate-300 via-slate-300 to-transparent dark:from-slate-600 dark:via-slate-600 dark:to-transparent" />
                </div>
              ) : null}
            </Fragment>
          ))}
        </div>

        <div className="mt-4 flex items-stretch gap-3">
          <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Side Paths
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Rejected and archived roles stay visually distinct so the active search funnel remains easy to scan.
              </p>
            </div>
          </div>

          {secondaryStages.map((status) => (
            <div key={status} className="w-56 shrink-0">
              <StageCard
                status={status}
                count={statusCounts[status]}
                maxCount={maxCount}
                totalTracked={totalTracked}
                compact
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobilePipeline({
  statusCounts,
  maxCount,
  totalTracked,
}: ApplicationPipelineProps & { maxCount: number; totalTracked: number }) {
  return (
    <div className="space-y-3 md:hidden">
      <div className="space-y-2">
        {primaryStages.map((status, index) => (
          <div key={status} className="flex gap-3">
            <div className="flex w-4 shrink-0 flex-col items-center">
              <span className={["mt-5 h-2.5 w-2.5 rounded-full", stageAccentClasses[status].dot].join(" ")} />
              {index < primaryStages.length - 1 ? (
                <span className="mt-2 h-full w-px bg-slate-300 dark:bg-slate-700" />
              ) : null}
            </div>
            <div className="flex-1">
              <StageCard
                status={status}
                count={statusCounts[status]}
                maxCount={maxCount}
                totalTracked={totalTracked}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-950/40">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Side Paths
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {secondaryStages.map((status) => (
            <StageCard
              key={status}
              status={status}
              count={statusCounts[status]}
              maxCount={maxCount}
              totalTracked={totalTracked}
              compact
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ApplicationPipeline({
  activeTotal,
  statusCounts,
}: ApplicationPipelineProps) {
  const totalTracked = Object.values(statusCounts).reduce(
    (total, count) => total + count,
    0,
  );
  const maxCount = Math.max(...Object.values(statusCounts), 0);

  return (
    <Card>
      <CardHeader className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle>Application Pipeline</CardTitle>
          <CardDescription>
            A visual breakdown of where your saved roles stand.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <SummaryChip label="Tracked roles" value={totalTracked} />
          <SummaryChip label="Active roles" value={activeTotal} />
        </div>
      </CardHeader>

      {totalTracked === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center dark:border-slate-700 dark:bg-slate-950/40">
          <p className="text-base font-semibold text-slate-950 dark:text-slate-100">
            No roles in your pipeline yet
          </p>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300">
            Add your first saved job to see how your search is moving through each stage.
          </p>
          <div className="mt-5 flex justify-center">
            <LinkButton href="/jobs/new">Add job</LinkButton>
          </div>
        </div>
      ) : (
        <>
          <DesktopPipeline
            activeTotal={activeTotal}
            statusCounts={statusCounts}
            maxCount={maxCount}
            totalTracked={totalTracked}
          />
          <MobilePipeline
            activeTotal={activeTotal}
            statusCounts={statusCounts}
            maxCount={maxCount}
            totalTracked={totalTracked}
          />
          <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Counts reflect each saved job&apos;s current status, not historical conversion between stages.
          </p>
        </>
      )}
    </Card>
  );
}
