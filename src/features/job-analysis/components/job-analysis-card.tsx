"use client";

import { useActionState } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  analyzeJobDescription,
  type AnalyzeJobDescriptionActionState,
} from "@/features/job-analysis/actions";
import {
  MAX_JOB_DESCRIPTION_ANALYSIS_CHARS,
  PRODUCTION_DAILY_AI_ANALYSIS_LIMIT,
} from "@/features/job-analysis/schemas";

type JobAnalysisCardProps = {
  analysis: {
    summary: string | null;
    requiredSkills: string[];
    preferredSkills: string[];
    responsibilities: string[];
    keywords: string[];
    seniorityLevel: string | null;
    updatedAt: Date;
  } | null;
  hasAnalyzableDescription: boolean;
  isDescriptionTooLong: boolean;
  descriptionLength: number;
  jobId: string;
};

const initialState: AnalyzeJobDescriptionActionState = {};

function AnalysisList({
  items,
  title,
}: {
  items: string[];
  title: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const defaultVisibleCount = 8;

  if (items.length === 0) {
    return null;
  }

  const visibleItems = expanded ? items : items.slice(0, defaultVisibleCount);
  const hasHiddenItems = items.length > defaultVisibleCount;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-slate-950">{title}</h3>
      <ul className="space-y-2 text-sm leading-6 text-slate-700">
        {visibleItems.map((item) => (
          <li key={item} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
      {hasHiddenItems ? (
        <button
          type="button"
          className="text-xs font-medium text-slate-700 underline underline-offset-4 hover:text-slate-950"
          onClick={() => {
            setExpanded((previous) => !previous);
          }}
        >
          {expanded ? "Show fewer items" : `Show ${items.length - defaultVisibleCount} more items`}
        </button>
      ) : null}
    </div>
  );
}

export function JobAnalysisCard({
  analysis,
  hasAnalyzableDescription,
  isDescriptionTooLong,
  descriptionLength,
  jobId,
}: JobAnalysisCardProps) {
  const [state, formAction, isPending] = useActionState(
    analyzeJobDescription,
    initialState,
  );

  const actionLabel = analysis ? "Re-analyze job description" : "Analyze job description";
  const hasAnalysis =
    analysis !== null &&
    (Boolean(analysis.summary) ||
      analysis.requiredSkills.length > 0 ||
      analysis.preferredSkills.length > 0 ||
      analysis.responsibilities.length > 0 ||
      analysis.keywords.length > 0 ||
      Boolean(analysis.seniorityLevel));
  const isActionDisabled = isPending || isDescriptionTooLong;
  const actionHelperText = hasAnalysis
    ? "Re-run analysis to refresh this job's extracted summary and requirements."
    : "Run analysis to extract a summary, skills, responsibilities, keywords, and seniority signals.";

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="jobId" value={jobId} />
        <div className="space-y-1 text-xs text-slate-600">
          <p>
            AI analysis is limited to {MAX_JOB_DESCRIPTION_ANALYSIS_CHARS.toLocaleString()} characters per job description.
          </p>
          <p>
            In production, each account can run {PRODUCTION_DAILY_AI_ANALYSIS_LIMIT} AI analyses per day.
          </p>
          <p>Analysis may take a few seconds.</p>
        </div>
        {hasAnalyzableDescription ? (
          <Button type="submit" disabled={isActionDisabled}>
            {isPending ? "Analyzing job description..." : actionLabel}
          </Button>
        ) : (
          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Add a fuller job description before running analysis.
          </div>
        )}
        {hasAnalyzableDescription && isDescriptionTooLong ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800" role="alert">
            This description is {descriptionLength.toLocaleString()} characters. Shorten it to{" "}
            {MAX_JOB_DESCRIPTION_ANALYSIS_CHARS.toLocaleString()} characters or less before analyzing.
          </p>
        ) : null}
        {isPending ? (
          <p className="text-sm text-slate-600" role="status">
            Analyzing job description... This may take a few seconds.
          </p>
        ) : (
          <p className="text-sm text-slate-600">{actionHelperText}</p>
        )}
        {state.formError ? (
          <p className="text-sm text-red-600" role="alert">
            {state.formError}
          </p>
        ) : null}
      </form>

      {hasAnalysis && analysis ? (
        <div className="space-y-5">
          {analysis.summary ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-950">Summary</h3>
              <div className="max-h-40 overflow-auto rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-sm leading-6 text-slate-700">{analysis.summary}</p>
              </div>
            </div>
          ) : null}

          {analysis.seniorityLevel ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-950">Seniority level</h3>
              <p className="text-sm leading-6 text-slate-700">
                {analysis.seniorityLevel}
              </p>
            </div>
          ) : null}

          <AnalysisList items={analysis.requiredSkills} title="Required skills" />
          <AnalysisList items={analysis.preferredSkills} title="Preferred skills" />
          <AnalysisList items={analysis.responsibilities} title="Responsibilities" />
          <AnalysisList items={analysis.keywords} title="Keywords" />

          <p className="text-xs text-slate-500">
            Last analyzed {analysis.updatedAt.toLocaleDateString()}
          </p>
        </div>
      ) : (
        <p className="text-sm text-slate-600">{actionHelperText}</p>
      )}
    </div>
  );
}
