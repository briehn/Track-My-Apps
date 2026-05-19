"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  extractProfileDetails,
  type ExtractProfileDetailsActionState,
} from "@/features/profiles/actions";
import { yearsOfExperienceLabels } from "@/features/profiles/options";
import {
  MAX_PROFILE_RESUME_EXTRACTION_CHARS,
  MIN_PROFILE_RESUME_EXTRACTION_CHARS,
  type ProfileExtractionSuggestion,
} from "@/features/profiles/schemas";

type ProfileExtractionPanelProps = {
  className?: string;
  hasSavedResumeText: boolean;
  savedResumeTextLength: number;
  isProfileDirty: boolean;
  isProfileSaving: boolean;
  onApplySuggestions: (suggestions: ProfileExtractionSuggestion) => void;
};

const initialState: ExtractProfileDetailsActionState = {};

const workPreferenceLabels: Record<
  ProfileExtractionSuggestion["workPreferences"][number],
  string
> = {
  ONSITE: "Onsite",
  HYBRID: "Hybrid",
  REMOTE: "Remote",
};

function SuggestionList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-slate-950 dark:text-slate-100">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ProfileExtractionPanel({
  className,
  hasSavedResumeText,
  savedResumeTextLength,
  isProfileDirty,
  isProfileSaving,
  onApplySuggestions,
}: ProfileExtractionPanelProps) {
  const [applyMessage, setApplyMessage] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(
    extractProfileDetails,
    initialState,
  );

  const isActionDisabled =
    isPending || isProfileSaving || isProfileDirty || !hasSavedResumeText;

  function handleApplySuggestions() {
    if (!state.suggestions) {
      return;
    }

    onApplySuggestions(state.suggestions);
    setApplyMessage("Suggestions applied to the form. Save changes to persist them.");
  }

  return (
    <div
      className={[
        "space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-950 dark:text-slate-100">AI profile extraction</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Generate suggestions from saved resume source text.
        </p>
      </div>

      <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
        <p>
          Save at least {MIN_PROFILE_RESUME_EXTRACTION_CHARS} characters of resume text before extracting suggestions.
        </p>
        <p>
          Resume text must stay under {MAX_PROFILE_RESUME_EXTRACTION_CHARS.toLocaleString()} characters.
        </p>
        {hasSavedResumeText ? (
          <p>Saved resume text length: {savedResumeTextLength.toLocaleString()} characters.</p>
        ) : null}
      </div>

      {!hasSavedResumeText ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
          Add and save resume text before extracting profile details.
        </div>
      ) : null}

      {isProfileDirty ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          Save or discard your current profile edits before extracting from the saved resume text.
        </div>
      ) : null}

      <div className="space-y-3">
        <Button
          type="submit"
          formAction={formAction}
          disabled={isActionDisabled}
        >
          {isPending ? "Extracting profile details..." : "Extract profile details"}
        </Button>

        {isPending ? (
          <p className="text-sm text-slate-600 dark:text-slate-300" role="status">
            Extracting profile suggestions... This may take a few seconds.
          </p>
        ) : null}

        {state.formError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
            {state.formError}
          </div>
        ) : null}

        {state.successMessage ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
            {state.successMessage}
          </div>
        ) : null}
      </div>

      {state.suggestions ? (
        <div className="space-y-4 rounded-md border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-950 dark:text-slate-100">Suggested profile details</h4>
            </div>
            <Button
              type="button"
              onClick={handleApplySuggestions}
              disabled={isProfileSaving}
            >
              Apply suggestions
            </Button>
          </div>

          {applyMessage ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
              {applyMessage}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {state.suggestions.targetTitle ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Target title
                </p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{state.suggestions.targetTitle}</p>
              </div>
            ) : null}

            {state.suggestions.yearsOfExperience ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Experience range
                </p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                  {yearsOfExperienceLabels[state.suggestions.yearsOfExperience]}
                </p>
              </div>
            ) : null}
          </div>

          {state.suggestions.experienceSummary ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-950">Experience summary</h4>
              <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">
                {state.suggestions.experienceSummary}
              </p>
            </div>
          ) : null}

          <SuggestionList title="Skills" items={state.suggestions.skills} />
          <SuggestionList
            title="Work preferences"
            items={state.suggestions.workPreferences.map((value) => workPreferenceLabels[value])}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            {state.suggestions.portfolioUrl ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Portfolio
                </p>
                <p className="mt-1 break-all text-sm text-slate-700">
                  {state.suggestions.portfolioUrl}
                </p>
              </div>
            ) : null}
            {state.suggestions.githubUrl ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  GitHub
                </p>
                <p className="mt-1 break-all text-sm text-slate-700">
                  {state.suggestions.githubUrl}
                </p>
              </div>
            ) : null}
            {state.suggestions.linkedinUrl ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  LinkedIn
                </p>
                <p className="mt-1 break-all text-sm text-slate-700">
                  {state.suggestions.linkedinUrl}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
