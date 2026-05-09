"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import {
  analyzeJobMatch,
  type AnalyzeJobMatchActionState,
} from "@/features/job-match/actions";
import type { JobMatchFitLevel } from "@/features/job-match/schemas";
import { type ReactNode, useActionState } from "react";

type JobMatchCardProps = {
  hasJobAnalysis: boolean;
  hasProfile: boolean;
  hasResumeText: boolean;
  jobId: string;
};

const initialState: AnalyzeJobMatchActionState = {};

const fitLevelBadgeVariants: Record<JobMatchFitLevel, "danger" | "success" | "warning"> =
  {
    LOW: "danger",
    MODERATE: "warning",
    STRONG: "success",
  };

function SectionList({
  items,
  title,
}: {
  items: string[];
  title: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-slate-950">{title}</h3>
      <ul className="space-y-2 text-sm leading-6 text-slate-700">
        {items.map((item) => (
          <li
            key={item}
            className="break-words rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function JobMatchCard({
  hasJobAnalysis,
  hasProfile,
  hasResumeText,
  jobId,
}: JobMatchCardProps) {
  const [state, formAction, isPending] = useActionState(
    analyzeJobMatch,
    initialState,
  );

  const missingPrerequisites: Array<{
    action?: ReactNode;
    description: string;
    title: string;
  }> = [];

  if (!hasJobAnalysis) {
    missingPrerequisites.push({
      title: "Analyze this job description first",
      description:
        "This comparison needs the saved job analysis before it can compare your profile against the role.",
    });
  }

  if (!hasProfile) {
    missingPrerequisites.push({
      title: "Complete your profile first",
      description:
        "Add your target role, skills, experience, and resume details before running a match report.",
      action: (
        <LinkButton href="/profile" variant="secondary">
          Go to profile
        </LinkButton>
      ),
    });
  }

  if (missingPrerequisites.length > 0) {
    return (
      <div className="space-y-4">
        {missingPrerequisites.map((prerequisite) => (
          <div
            key={prerequisite.title}
            className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-4"
          >
            <p className="text-sm font-medium text-slate-950">{prerequisite.title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {prerequisite.description}
            </p>
            {prerequisite.action ? <div className="mt-3">{prerequisite.action}</div> : null}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-4 rounded-md border border-slate-200 bg-slate-50 p-4">
        <input type="hidden" name="jobId" value={jobId} />
        <div className="space-y-1 text-xs text-slate-600">
          <p>
            This report is based on your saved profile and this job&apos;s analysis.
          </p>
          <p>Matching is manual only and does not save any report history in this MVP.</p>
          <p>The fit level is directional guidance, not a hiring prediction.</p>
        </div>

        {!hasResumeText ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Your profile does not include saved resume text, so the match report may be less complete.
          </p>
        ) : null}

        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? "Comparing profile..." : "Compare my profile"}
        </Button>

        {isPending ? (
          <p className="text-sm text-slate-600" role="status">
            Comparing your saved profile against this job&apos;s analysis...
          </p>
        ) : null}

        {state.formError ? (
          <div
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            <p>{state.formError}</p>
            {state.canRetry ? (
              <p className="mt-1 text-xs text-red-600">
                You can retry the comparison now.
              </p>
            ) : null}
          </div>
        ) : null}
      </form>

      {state.report ? (
        <div className="space-y-4">
          <div className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-950">Match report</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Based on your saved profile and this job&apos;s analysis.
                </p>
              </div>
              <Badge variant={fitLevelBadgeVariants[state.report.fitLevel]}>
                {state.report.fitLevel} fit
              </Badge>
            </div>
            <p className="break-words text-sm leading-6 text-slate-700">
              {state.report.overallFitSummary}
            </p>
          </div>

          {state.report.warnings.length > 0 ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
              <h3 className="text-sm font-medium text-amber-900">Warnings</h3>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-amber-900">
                {state.report.warnings.map((warning) => (
                  <li key={warning} className="break-words">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <details className="rounded-md border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-medium text-slate-950">
              View detailed match breakdown
            </summary>
            <div className="mt-4 space-y-5">
              <SectionList items={state.report.matchingSkills} title="Matching skills" />
              <SectionList
                items={state.report.missingOrWeakSkills}
                title="Missing or weak skills"
              />
              <SectionList
                items={state.report.relevantProfileEvidence}
                title="Relevant profile evidence"
              />
              <SectionList
                items={state.report.resumeImprovementSuggestions}
                title="Resume improvement suggestions"
              />
              <SectionList
                items={state.report.interviewPrepFocusAreas}
                title="Interview prep focus areas"
              />
            </div>
          </details>
        </div>
      ) : null}
    </div>
  );
}
