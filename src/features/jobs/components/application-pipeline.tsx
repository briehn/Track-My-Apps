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

const primaryNodePositions: Record<
  (typeof primaryStages)[number],
  {
    x: number;
    y: number;
  }
> = {
  SAVED: { x: 12, y: 42 },
  APPLIED: { x: 36, y: 28 },
  INTERVIEWING: { x: 60, y: 42 },
  OFFER: { x: 84, y: 26 },
};

const secondaryNodePositions: Record<
  (typeof secondaryStages)[number],
  {
    x: number;
    y: number;
  }
> = {
  REJECTED: { x: 68, y: 74 },
  ARCHIVED: { x: 86, y: 74 },
};

const stageAccentClasses: Record<
  ApplicationStatus,
  {
    dot: string;
    meter: string;
    path: string;
    surface: string;
    ring: string;
  }
> = {
  SAVED: {
    dot: "bg-slate-500 dark:bg-slate-300",
    meter: "bg-slate-500 dark:bg-slate-300",
    path: "stroke-slate-500/80 dark:stroke-slate-300/75",
    surface: "bg-slate-500/10 dark:bg-slate-300/10",
    ring: "ring-slate-300/70 dark:ring-slate-600/70",
  },
  APPLIED: {
    dot: "bg-sky-500 dark:bg-sky-400",
    meter: "bg-sky-500 dark:bg-sky-400",
    path: "stroke-sky-500/75 dark:stroke-sky-400/70",
    surface: "bg-sky-500/10 dark:bg-sky-400/10",
    ring: "ring-sky-200/80 dark:ring-sky-900/60",
  },
  INTERVIEWING: {
    dot: "bg-amber-500 dark:bg-amber-400",
    meter: "bg-amber-500 dark:bg-amber-400",
    path: "stroke-amber-500/80 dark:stroke-amber-400/75",
    surface: "bg-amber-500/10 dark:bg-amber-400/10",
    ring: "ring-amber-200/80 dark:ring-amber-900/60",
  },
  OFFER: {
    dot: "bg-emerald-500 dark:bg-emerald-400",
    meter: "bg-emerald-500 dark:bg-emerald-400",
    path: "stroke-emerald-500/80 dark:stroke-emerald-400/75",
    surface: "bg-emerald-500/10 dark:bg-emerald-400/10",
    ring: "ring-emerald-200/80 dark:ring-emerald-900/60",
  },
  REJECTED: {
    dot: "bg-rose-500 dark:bg-rose-400",
    meter: "bg-rose-500 dark:bg-rose-400",
    path: "stroke-rose-500/60 dark:stroke-rose-400/60",
    surface: "bg-rose-500/10 dark:bg-rose-400/10",
    ring: "ring-rose-200/80 dark:ring-rose-900/50",
  },
  ARCHIVED: {
    dot: "bg-slate-400 dark:bg-slate-500",
    meter: "bg-slate-400 dark:bg-slate-500",
    path: "stroke-slate-400/65 dark:stroke-slate-500/70",
    surface: "bg-slate-400/10 dark:bg-slate-500/10",
    ring: "ring-slate-200/80 dark:ring-slate-700/70",
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

type DesktopStageNodeProps = {
  status: ApplicationStatus;
  count: number;
  maxCount: number;
  totalTracked: number;
  x: number;
  y: number;
  secondary?: boolean;
};

function getStageMeterWidth(count: number, maxCount: number) {
  if (count === 0 || maxCount === 0) {
    return "0%";
  }

  return `${Math.max((count / maxCount) * 100, 12)}%`;
}

function getFlowStrokeWidth(startCount: number, endCount: number, maxCount: number) {
  if (maxCount === 0) {
    return 10;
  }

  const averageCount = (startCount + endCount) / 2;

  return 12 + (averageCount / maxCount) * 24;
}

function getBranchStrokeWidth(count: number, maxCount: number) {
  if (count === 0 || maxCount === 0) {
    return 6;
  }

  return 8 + (count / maxCount) * 18;
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

function DesktopStageNode({
  status,
  count,
  maxCount,
  totalTracked,
  x,
  y,
  secondary = false,
}: DesktopStageNodeProps) {
  const accents = stageAccentClasses[status];

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div
        className={[
          "w-40 rounded-2xl border bg-white/92 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:bg-slate-900/88 dark:shadow-[0_12px_28px_rgba(2,6,23,0.4)]",
          secondary
            ? "border-dashed border-slate-300 dark:border-slate-600"
            : "border-slate-200 dark:border-slate-700",
          accents.surface,
          `ring-1 ${accents.ring}`,
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={["h-2.5 w-2.5 rounded-full", accents.dot].join(" ")} />
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {statusLabels[status]}
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-white/80 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
            {count}
          </span>
        </div>

        <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
          {count}
        </p>

        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-slate-200/80 dark:bg-slate-800">
            <div
              className={["h-1.5 rounded-full", accents.meter].join(" ")}
              style={{ width: getStageMeterWidth(count, maxCount) }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {formatShare(count, totalTracked)}
          </p>
        </div>
      </div>
    </div>
  );
}

function DesktopFlowChart({
  statusCounts,
  maxCount,
  totalTracked,
}: {
  statusCounts: Record<ApplicationStatus, number>;
  maxCount: number;
  totalTracked: number;
}) {
  const savedToAppliedWidth = getFlowStrokeWidth(
    statusCounts.SAVED,
    statusCounts.APPLIED,
    maxCount,
  );
  const appliedToInterviewingWidth = getFlowStrokeWidth(
    statusCounts.APPLIED,
    statusCounts.INTERVIEWING,
    maxCount,
  );
  const interviewingToOfferWidth = getFlowStrokeWidth(
    statusCounts.INTERVIEWING,
    statusCounts.OFFER,
    maxCount,
  );
  const rejectedBranchWidth = getBranchStrokeWidth(statusCounts.REJECTED, maxCount);
  const archivedBranchWidth = getBranchStrokeWidth(statusCounts.ARCHIVED, maxCount);

  return (
    <div className="hidden lg:block">
      <div className="rounded-[28px] border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/40">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Pipeline snapshot
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Weighted connections mirror relative stage volume across your current saved roles.
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
            Current status distribution
          </div>
        </div>

        <div className="relative h-[22rem] overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/65 p-4 dark:border-slate-700 dark:bg-slate-900/70">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.12),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(148,163,184,0.12),transparent_36%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.08),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.2),transparent_32%)]" />
          <div className="absolute inset-x-6 top-6 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />
          <div className="absolute inset-x-6 bottom-24 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />

          <svg
            viewBox="0 0 960 320"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full"
          >
            <path
              d="M 130 145 C 220 145, 270 102, 360 102"
              className="fill-none stroke-slate-200/80 dark:stroke-slate-700/70"
              strokeWidth={savedToAppliedWidth + 10}
              strokeLinecap="round"
            />
            <path
              d="M 130 145 C 220 145, 270 102, 360 102"
              className={["fill-none", stageAccentClasses.APPLIED.path].join(" ")}
              strokeWidth={savedToAppliedWidth}
              strokeLinecap="round"
            />

            <path
              d="M 360 102 C 450 102, 500 145, 590 145"
              className="fill-none stroke-slate-200/80 dark:stroke-slate-700/70"
              strokeWidth={appliedToInterviewingWidth + 10}
              strokeLinecap="round"
            />
            <path
              d="M 360 102 C 450 102, 500 145, 590 145"
              className={["fill-none", stageAccentClasses.INTERVIEWING.path].join(" ")}
              strokeWidth={appliedToInterviewingWidth}
              strokeLinecap="round"
            />

            <path
              d="M 590 145 C 680 145, 730 100, 820 100"
              className="fill-none stroke-slate-200/80 dark:stroke-slate-700/70"
              strokeWidth={interviewingToOfferWidth + 10}
              strokeLinecap="round"
            />
            <path
              d="M 590 145 C 680 145, 730 100, 820 100"
              className={["fill-none", stageAccentClasses.OFFER.path].join(" ")}
              strokeWidth={interviewingToOfferWidth}
              strokeLinecap="round"
            />

            <path
              d="M 450 228 C 525 228, 585 255, 680 255"
              className="fill-none stroke-slate-200/70 dark:stroke-slate-700/70"
              strokeWidth={rejectedBranchWidth + 8}
              strokeLinecap="round"
            />
            <path
              d="M 450 228 C 525 228, 585 255, 680 255"
              className={["fill-none", stageAccentClasses.REJECTED.path].join(" ")}
              strokeWidth={rejectedBranchWidth}
              strokeLinecap="round"
            />

            <path
              d="M 680 255 C 740 255, 790 255, 860 255"
              className="fill-none stroke-slate-200/70 dark:stroke-slate-700/70"
              strokeWidth={archivedBranchWidth + 8}
              strokeLinecap="round"
              strokeDasharray="2 16"
            />
            <path
              d="M 680 255 C 740 255, 790 255, 860 255"
              className={["fill-none", stageAccentClasses.ARCHIVED.path].join(" ")}
              strokeWidth={archivedBranchWidth}
              strokeLinecap="round"
              strokeDasharray="2 16"
            />
          </svg>

          <div className="absolute left-[50%] top-[68%] -translate-x-1/2 rounded-full border border-dashed border-slate-300 bg-white/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-400">
            Side paths
          </div>

          {primaryStages.map((status) => (
            <DesktopStageNode
              key={status}
              status={status}
              count={statusCounts[status]}
              maxCount={maxCount}
              totalTracked={totalTracked}
              x={primaryNodePositions[status].x}
              y={primaryNodePositions[status].y}
            />
          ))}

          {secondaryStages.map((status) => (
            <DesktopStageNode
              key={status}
              status={status}
              count={statusCounts[status]}
              maxCount={maxCount}
              totalTracked={totalTracked}
              x={secondaryNodePositions[status].x}
              y={secondaryNodePositions[status].y}
              secondary
            />
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
    <div className="space-y-3 lg:hidden">
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-950/40">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Pipeline snapshot
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Compact view for smaller screens.
            </p>
          </div>
        </div>

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
          <DesktopFlowChart
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
