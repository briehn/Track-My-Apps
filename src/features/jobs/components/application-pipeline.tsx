"use client";

import { useEffect, useRef, useState } from "react";
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
const chartWidth = 1240;
const chartHeight = 520;
const PIPELINE_VIEW_STORAGE_KEY = "application-pipeline-view";

type PipelineView = "chart" | "cards";

type SvgNodeLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const primaryNodeLayouts: Record<(typeof primaryStages)[number], SvgNodeLayout> = {
  SAVED: { x: 0, y: 124, width: 166, height: 96 },
  APPLIED: { x: 322, y: 48, width: 166, height: 96 },
  INTERVIEWING: { x: 674, y: 124, width: 180, height: 96 },
  OFFER: { x: 1070, y: 46, width: 166, height: 96 },
};

const secondaryNodeLayouts: Record<
  (typeof secondaryStages)[number],
  SvgNodeLayout
> = {
  REJECTED: { x: 338, y: 356, width: 166, height: 96 },
  ARCHIVED: { x: 1070, y: 356, width: 166, height: 96 },
};

const stageClasses: Record<
  ApplicationStatus,
  {
    dot: string;
    meter: string;
    path: string;
    accentFill: string;
  }
> = {
  SAVED: {
    dot: "bg-slate-500 dark:bg-slate-300",
    meter: "bg-slate-500 dark:bg-slate-300",
    path: "stroke-slate-500/80 dark:stroke-slate-300/75",
    accentFill: "fill-slate-500 dark:fill-slate-300",
  },
  APPLIED: {
    dot: "bg-sky-500 dark:bg-sky-400",
    meter: "bg-sky-500 dark:bg-sky-400",
    path: "stroke-sky-500/75 dark:stroke-sky-400/70",
    accentFill: "fill-sky-500 dark:fill-sky-400",
  },
  INTERVIEWING: {
    dot: "bg-amber-500 dark:bg-amber-400",
    meter: "bg-amber-500 dark:bg-amber-400",
    path: "stroke-amber-500/80 dark:stroke-amber-400/75",
    accentFill: "fill-amber-500 dark:fill-amber-400",
  },
  OFFER: {
    dot: "bg-emerald-500 dark:bg-emerald-400",
    meter: "bg-emerald-500 dark:bg-emerald-400",
    path: "stroke-emerald-500/80 dark:stroke-emerald-400/75",
    accentFill: "fill-emerald-500 dark:fill-emerald-400",
  },
  REJECTED: {
    dot: "bg-rose-500 dark:bg-rose-400",
    meter: "bg-rose-500 dark:bg-rose-400",
    path: "stroke-rose-500/60 dark:stroke-rose-400/60",
    accentFill: "fill-rose-500 dark:fill-rose-400",
  },
  ARCHIVED: {
    dot: "bg-slate-400 dark:bg-slate-500",
    meter: "bg-slate-400 dark:bg-slate-500",
    path: "stroke-slate-400/70 dark:stroke-slate-500/75",
    accentFill: "fill-slate-400 dark:fill-slate-500",
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

function getSvgMeterWidth(count: number, maxCount: number, totalWidth: number) {
  if (count === 0 || maxCount === 0) {
    return 0;
  }

  return Math.max((count / maxCount) * totalWidth, 18);
}

function getFlowStrokeWidth(
  startCount: number,
  endCount: number,
  maxCount: number,
) {
  if (maxCount === 0) {
    return 10;
  }

  const averageCount = (startCount + endCount) / 2;

  return 12 + (averageCount / maxCount) * 22;
}

function getBranchStrokeWidth(count: number, maxCount: number) {
  if (count === 0 || maxCount === 0) {
    return 6;
  }

  return 8 + (count / maxCount) * 16;
}

function formatShare(count: number, totalTracked: number) {
  if (totalTracked === 0) {
    return "No roles yet";
  }

  const percentage = Math.round((count / totalTracked) * 100);

  return `${percentage}% of tracked roles`;
}

function getNodeRightAnchor(layout: SvgNodeLayout) {
  return {
    x: layout.x + layout.width,
    y: layout.y + layout.height / 2,
  };
}

function getNodeLeftAnchor(layout: SvgNodeLayout) {
  return {
    x: layout.x,
    y: layout.y + layout.height / 2,
  };
}

function getNodeBottomBranchAnchor(layout: SvgNodeLayout) {
  return {
    x: layout.x + layout.width * 0.5,
    y: layout.y + layout.height,
  };
}

function buildBandPath(start: { x: number; y: number }, end: { x: number; y: number }) {
  const horizontalDistance = end.x - start.x;
  const controlOffset = Math.min(horizontalDistance * 0.42, 86);

  return `M ${start.x} ${start.y} C ${start.x + controlOffset} ${start.y}, ${end.x - controlOffset} ${end.y}, ${end.x} ${end.y}`;
}

function StageCard({
  status,
  count,
  maxCount,
  totalTracked,
  compact = false,
}: StageCardProps) {
  const accents = stageClasses[status];
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

function ViewToggle({
  view,
  onChange,
}: {
  view: PipelineView;
  onChange: (view: PipelineView) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Application pipeline view"
      className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-700 dark:bg-slate-900/70"
    >
      {(["chart", "cards"] as const).map((option) => {
        const isActive = view === option;
        const label = option[0].toUpperCase() + option.slice(1);

        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`${label} view`}
            onClick={() => onChange(option)}
            className={[
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-[background-color,border-color,box-shadow,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 focus-visible:ring-offset-2 dark:focus-visible:ring-sky-400/70 dark:focus-visible:ring-offset-slate-950",
              isActive
                ? "border-slate-300 bg-white text-slate-900 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                : "border-transparent bg-transparent text-slate-600 hover:bg-white/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-slate-100",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function InfoTooltip({
  id,
  label,
  tooltip,
}: {
  id: string;
  label: string;
  tooltip: string;
}) {
  return (
    <span className="group/tooltip relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-describedby={id}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-[11px] font-semibold text-slate-500 transition hover:border-slate-400 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100 dark:focus:ring-slate-500 dark:focus:ring-offset-slate-950"
      >
        i
      </button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-64 -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs leading-5 text-slate-600 opacity-0 shadow-lg transition group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
      >
        {tooltip}
      </span>
    </span>
  );
}

function StatusGridCard({
  label,
  count,
  accentClass,
}: {
  label: string;
  count: number;
  accentClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/85">
      <div className="flex items-center gap-2">
        <span className={["h-2.5 w-2.5 rounded-full", accentClass].join(" ")} />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          {label}
        </p>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
        {count}
      </p>
    </div>
  );
}

function SvgStageNode({
  status,
  count,
  maxCount,
  totalTracked,
  layout,
  secondary = false,
}: {
  status: ApplicationStatus;
  count: number;
  maxCount: number;
  totalTracked: number;
  layout: SvgNodeLayout;
  secondary?: boolean;
}) {
  const accent = stageClasses[status];
  const meterTrackWidth = layout.width - 28;
  const meterWidth = getSvgMeterWidth(count, maxCount, meterTrackWidth);

  return (
    <g>
      <rect
        x={layout.x}
        y={layout.y}
        width={layout.width}
        height={layout.height}
        rx={22}
        className="fill-white/95 stroke-slate-200 dark:fill-slate-900/92 dark:stroke-slate-700"
        strokeWidth={1.5}
        strokeDasharray={secondary ? "6 6" : undefined}
      />
      <circle
        cx={layout.x + 16}
        cy={layout.y + 18}
        r={4}
        className={accent.accentFill}
      />
      <text
        x={layout.x + 28}
        y={layout.y + 22}
        className="fill-slate-500 text-[11px] font-semibold uppercase tracking-[0.18em] dark:fill-slate-400"
      >
        {statusLabels[status]}
      </text>
      <text
        x={layout.x + 14}
        y={layout.y + 54}
        className="fill-slate-950 text-[30px] font-semibold dark:fill-slate-100"
      >
        {count}
      </text>
      <rect
        x={layout.x + 14}
        y={layout.y + layout.height - 22}
        width={meterTrackWidth}
        height={6}
        rx={3}
        className="fill-slate-200/90 dark:fill-slate-800"
      />
      <rect
        x={layout.x + 14}
        y={layout.y + layout.height - 22}
        width={meterWidth}
        height={6}
        rx={3}
        className={accent.accentFill}
      />
      <text
        x={layout.x + 14}
        y={layout.y + layout.height - 5}
        className="fill-slate-500 text-[11px] dark:fill-slate-400"
      >
        {formatShare(count, totalTracked)}
      </text>
    </g>
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
  const rejectedBranchWidth = getBranchStrokeWidth(
    statusCounts.REJECTED,
    maxCount,
  );

  const savedToAppliedPath = buildBandPath(
    getNodeRightAnchor(primaryNodeLayouts.SAVED),
    getNodeLeftAnchor(primaryNodeLayouts.APPLIED),
  );
  const appliedToInterviewingPath = buildBandPath(
    getNodeRightAnchor(primaryNodeLayouts.APPLIED),
    getNodeLeftAnchor(primaryNodeLayouts.INTERVIEWING),
  );
  const interviewingToOfferPath = buildBandPath(
    getNodeRightAnchor(primaryNodeLayouts.INTERVIEWING),
    getNodeLeftAnchor(primaryNodeLayouts.OFFER),
  );

  const rejectedPath = buildBandPath(
    getNodeBottomBranchAnchor(primaryNodeLayouts.SAVED),
    getNodeLeftAnchor(secondaryNodeLayouts.REJECTED),
  );

  return (
    <div className="hidden lg:block">
      <div className="rounded-[28px] bg-slate-50/55 px-1 pb-1 pt-2 dark:bg-slate-950/30">
        <div className="mb-2 flex items-center justify-between gap-3 px-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Pipeline snapshot
          </p>
          <div className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
            Current snapshot
          </div>
        </div>

        <div className="overflow-hidden rounded-[24px]">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            aria-hidden="true"
            className="block h-[31rem] w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <path
              d={savedToAppliedPath}
              className="fill-none stroke-slate-200/80 dark:stroke-slate-700/70"
              strokeWidth={savedToAppliedWidth + 8}
              strokeLinecap="round"
            />
            <path
              d={savedToAppliedPath}
              className={["fill-none", stageClasses.APPLIED.path].join(" ")}
              strokeWidth={savedToAppliedWidth}
              strokeLinecap="round"
            />

            <path
              d={appliedToInterviewingPath}
              className="fill-none stroke-slate-200/80 dark:stroke-slate-700/70"
              strokeWidth={appliedToInterviewingWidth + 8}
              strokeLinecap="round"
            />
            <path
              d={appliedToInterviewingPath}
              className={["fill-none", stageClasses.INTERVIEWING.path].join(" ")}
              strokeWidth={appliedToInterviewingWidth}
              strokeLinecap="round"
            />

            <path
              d={interviewingToOfferPath}
              className="fill-none stroke-slate-200/80 dark:stroke-slate-700/70"
              strokeWidth={interviewingToOfferWidth + 8}
              strokeLinecap="round"
            />
            <path
              d={interviewingToOfferPath}
              className={["fill-none", stageClasses.OFFER.path].join(" ")}
              strokeWidth={interviewingToOfferWidth}
              strokeLinecap="round"
            />

            <path
              d={rejectedPath}
              className="fill-none stroke-slate-200/70 dark:stroke-slate-700/70"
              strokeWidth={rejectedBranchWidth + 6}
              strokeLinecap="round"
            />
            <path
              d={rejectedPath}
              className={["fill-none", stageClasses.REJECTED.path].join(" ")}
              strokeWidth={rejectedBranchWidth}
              strokeLinecap="round"
            />

            {primaryStages.map((status) => (
              <SvgStageNode
                key={status}
                status={status}
                count={statusCounts[status]}
                maxCount={maxCount}
                totalTracked={totalTracked}
                layout={primaryNodeLayouts[status]}
              />
            ))}

            {secondaryStages.map((status) => (
              <SvgStageNode
                key={status}
                status={status}
                count={statusCounts[status]}
                maxCount={maxCount}
                totalTracked={totalTracked}
                layout={secondaryNodeLayouts[status]}
                secondary
              />
            ))}
          </svg>
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
          </div>
        </div>

        <div className="space-y-2">
          {primaryStages.map((status, index) => (
            <div key={status} className="flex gap-3">
              <div className="flex w-4 shrink-0 flex-col items-center">
                <span className={["mt-5 h-2.5 w-2.5 rounded-full", stageClasses[status].dot].join(" ")} />
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

function CardsPipelineView({
  activeTotal,
  statusCounts,
}: ApplicationPipelineProps) {
  return (
    <div className="rounded-2xl bg-slate-50/55 p-3 dark:bg-slate-950/30">
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Pipeline snapshot
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatusGridCard
          label="Active jobs"
          count={activeTotal}
          accentClass="bg-indigo-500 dark:bg-indigo-400"
        />
        <StatusGridCard
          label={statusLabels.SAVED}
          count={statusCounts.SAVED}
          accentClass={stageClasses.SAVED.dot}
        />
        <StatusGridCard
          label={statusLabels.APPLIED}
          count={statusCounts.APPLIED}
          accentClass={stageClasses.APPLIED.dot}
        />
        <StatusGridCard
          label={statusLabels.INTERVIEWING}
          count={statusCounts.INTERVIEWING}
          accentClass={stageClasses.INTERVIEWING.dot}
        />
        <StatusGridCard
          label={statusLabels.OFFER}
          count={statusCounts.OFFER}
          accentClass={stageClasses.OFFER.dot}
        />
        <StatusGridCard
          label={statusLabels.REJECTED}
          count={statusCounts.REJECTED}
          accentClass={stageClasses.REJECTED.dot}
        />
        <StatusGridCard
          label={statusLabels.ARCHIVED}
          count={statusCounts.ARCHIVED}
          accentClass={stageClasses.ARCHIVED.dot}
        />
      </div>
    </div>
  );
}

export function ApplicationPipeline({
  activeTotal,
  statusCounts,
}: ApplicationPipelineProps) {
  const [view, setView] = useState<PipelineView>("chart");
  const hasLoadedStoredView = useRef(false);
  const totalTracked = Object.values(statusCounts).reduce(
    (total, count) => total + count,
    0,
  );
  const maxCount = Math.max(...Object.values(statusCounts), 0);

  useEffect(() => {
    Promise.resolve().then(() => {
      const storedView = window.localStorage.getItem(PIPELINE_VIEW_STORAGE_KEY);
      if (storedView === "chart" || storedView === "cards") {
        setView(storedView);
      }
      hasLoadedStoredView.current = true;
    });
  }, []);

  useEffect(() => {
    if (!hasLoadedStoredView.current) {
      return;
    }

    window.localStorage.setItem(PIPELINE_VIEW_STORAGE_KEY, view);
  }, [view]);

  return (
    <Card>
      <CardHeader className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>Application Pipeline</CardTitle>
            <InfoTooltip
              id="application-pipeline-tooltip-title"
              label="Explain application pipeline"
              tooltip="This chart shows a snapshot of your current job statuses. It does not represent historical conversion between stages."
            />
          </div>
          <CardDescription>
            A visual breakdown of where your saved roles stand.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ViewToggle view={view} onChange={setView} />
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
          {view === "chart" ? (
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
            </>
          ) : (
            <CardsPipelineView activeTotal={activeTotal} statusCounts={statusCounts} />
          )}
        </>
      )}
    </Card>
  );
}
