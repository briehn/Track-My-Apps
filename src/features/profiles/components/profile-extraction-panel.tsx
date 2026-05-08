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
      <h4 className="text-sm font-medium text-slate-950">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ProfileExtractionPanel({
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
    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-950">AI profile extraction</h3>
        <p className="text-sm text-slate-600">
          AI suggestions are not saved until you apply them and click Save changes.
        </p>
      </div>

      <div className="space-y-1 text-xs text-slate-500">
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
        <div className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600">
          Add and save resume text before extracting profile details.
        </div>
      ) : null}

      {isProfileDirty ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
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
          <p className="text-sm text-slate-600" role="status">
            Extracting profile suggestions... This may take a few seconds.
          </p>
        ) : null}

        {state.formError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.formError}
          </div>
        ) : null}

        {state.successMessage ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {state.successMessage}
          </div>
        ) : null}
      </div>

      {state.suggestions ? (
        <div className="space-y-4 rounded-md border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-950">Suggested profile details</h4>
              <p className="mt-1 text-sm text-slate-600">
                Review these suggestions before applying them to the form.
              </p>
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
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {applyMessage}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {state.suggestions.targetTitle ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Target title
                </p>
                <p className="mt-1 text-sm text-slate-700">{state.suggestions.targetTitle}</p>
              </div>
            ) : null}

            {state.suggestions.yearsOfExperience ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Experience range
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {yearsOfExperienceLabels[state.suggestions.yearsOfExperience]}
                </p>
              </div>
            ) : null}
          </div>

          {state.suggestions.experienceSummary ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-950">Experience summary</h4>
              <p className="text-sm leading-6 text-slate-700">
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
