"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import {
  generateInterviewPrep,
  type GenerateInterviewPrepActionState,
} from "@/features/interview-prep/actions";

type InterviewPrepCardProps = {
  hasJobAnalysis: boolean;
  hasProfile: boolean;
  hasResumeText: boolean;
  isJobAnalysisStale: boolean;
  jobId: string;
};

const initialState: GenerateInterviewPrepActionState = {};
const DEFAULT_VISIBLE_ITEMS = 4;

function FocusAreaCard({
  items,
  title,
}: {
  items: string[];
  title: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200/80 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-sm font-medium text-slate-950 dark:text-slate-100">{title}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          No specific items were generated for this section.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200/80 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-sm font-medium text-slate-950 dark:text-slate-100">{title}</h3>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300">
        {items.slice(0, 4).map((item) => (
          <li key={item} className="break-words">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PromptSection({
  items,
  title,
}: {
  items: string[];
  title: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (items.length === 0) {
    return null;
  }

  const hasHiddenItems = items.length > DEFAULT_VISIBLE_ITEMS;
  const visibleItems =
    isExpanded || !hasHiddenItems ? items : items.slice(0, DEFAULT_VISIBLE_ITEMS);

  return (
    <section className="rounded-lg border border-slate-200/80 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-sm font-medium text-slate-950 dark:text-slate-100">{title}</h3>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700 marker:text-slate-500 dark:text-slate-300 dark:marker:text-slate-500">
        {visibleItems.map((item) => (
          <li key={item} className="break-words">
            {item}
          </li>
        ))}
      </ol>
      {hasHiddenItems ? (
        <button
          type="button"
          className="mt-3 inline-flex rounded-md text-sm font-medium text-slate-700 underline underline-offset-4 transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 focus-visible:ring-offset-2 dark:text-slate-300 dark:hover:text-slate-100 dark:focus-visible:ring-sky-400/70 dark:focus-visible:ring-offset-slate-950"
          onClick={() => {
            setIsExpanded((previous) => !previous);
          }}
        >
          {isExpanded
            ? "Show less"
            : `Show ${items.length - DEFAULT_VISIBLE_ITEMS} more`}
        </button>
      ) : null}
    </section>
  );
}

export function InterviewPrepCard({
  hasJobAnalysis,
  hasProfile,
  hasResumeText,
  isJobAnalysisStale,
  jobId,
}: InterviewPrepCardProps) {
  const [state, formAction, isPending] = useActionState(
    generateInterviewPrep,
    initialState,
  );

  if (!hasJobAnalysis) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-4 dark:border-slate-600 dark:bg-slate-900/60">
        <p className="text-sm font-medium text-slate-950 dark:text-slate-100">
          Analyze this job description first
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Interview prep requires this job&apos;s saved analysis before guidance can
          be generated.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form
        action={formAction}
        className="space-y-4 rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60"
      >
        <input type="hidden" name="jobId" value={jobId} />
        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
          <p>
            This prep is generated from this job&apos;s saved analysis and optional
            saved profile context.
          </p>
          <p>Interview prep reports are transient and are not saved in this MVP.</p>
          <p>Guidance is directional coaching, not a guarantee of interview outcomes.</p>
        </div>

        {!hasProfile ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-white px-3 py-3 dark:border-slate-600 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-950 dark:text-slate-100">
              Add a profile to improve personalization
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
              You can still generate prep now using only job analysis data.
            </p>
            <div className="mt-3">
              <LinkButton href="/profile" variant="secondary">
                Go to profile
              </LinkButton>
            </div>
          </div>
        ) : null}

        {hasProfile && !hasResumeText ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
            Your profile does not include saved resume text, so personalization may be
            less complete.
          </p>
        ) : null}
        {isJobAnalysisStale ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
            Interview prep may be based on outdated job analysis. Re-run analysis for the latest guidance.
          </p>
        ) : null}

        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? "Generating interview prep..." : "Generate interview prep"}
        </Button>

        {isPending ? (
          <p className="text-sm text-slate-600 dark:text-slate-400" role="status">
            Generating interview prep from your saved job analysis...
          </p>
        ) : null}

        {state.formError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200" role="alert">
            <p>{state.formError}</p>
            {state.canRetry ? (
              <p className="mt-1 text-xs text-red-600">
                You can retry interview prep now.
              </p>
            ) : null}
          </div>
        ) : null}
      </form>

      {state.report ? (
        <div className="space-y-4">
          <div className="space-y-3 rounded-lg border border-slate-200/80 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-sm font-medium text-slate-950 dark:text-slate-100">
              Prep focus summary
            </h3>
            <p className="break-words text-sm leading-6 text-slate-700 dark:text-slate-300">
              {state.report.prepSummary}
            </p>
          </div>

          {state.report.warnings.length > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/40 dark:bg-amber-500/10">
              <h3 className="text-sm font-medium text-amber-900 dark:text-amber-200">
                Profile or context limitations
              </h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-amber-900 dark:text-amber-200">
                {state.report.warnings.map((warning) => (
                  <li key={warning} className="break-words">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-3">
            <FocusAreaCard
              items={state.report.topicsToReview}
              title="Topics to review"
            />
            <FocusAreaCard
              items={state.report.gapsOrWeakAreas}
              title="Weak areas to prepare"
            />
            <FocusAreaCard
              items={state.report.roleSpecificTalkingPoints}
              title="Role-specific talking points"
            />
          </div>

          <div className="space-y-3">
            <PromptSection
              items={state.report.likelyTechnicalQuestions}
              title="Technical questions"
            />
            <PromptSection
              items={state.report.likelyBehavioralQuestions}
              title="Behavioral / STAR prompts"
            />
            <PromptSection
              items={state.report.questionsToAskInterviewer}
              title="Questions to ask the interviewer"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
