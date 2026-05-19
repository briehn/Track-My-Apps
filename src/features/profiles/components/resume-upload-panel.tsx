"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  importResumeText,
  type ImportResumeTextActionState,
} from "@/features/profiles/actions";
import { yearsOfExperienceLabels } from "@/features/profiles/options";
import type { ProfileExtractionSuggestion } from "@/features/profiles/schemas";

type ResumeUploadPanelProps = {
  className?: string;
  isProfileSaving: boolean;
  onApplySuggestions: (suggestions: ProfileExtractionSuggestion) => void;
  onApplyResumeSourceText: (sourceText: string) => void;
};

const ACCEPTED_FILE_TYPES =
  ".txt,.docx,.pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf";

const MAX_UPLOAD_FILE_SIZE_MB = 3;
const initialState: ImportResumeTextActionState = {};

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

export function ResumeUploadPanel({
  className,
  isProfileSaving,
  onApplySuggestions,
  onApplyResumeSourceText,
}: ResumeUploadPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [state, setState] = useState<ImportResumeTextActionState>(initialState);
  const [isPending, startTransition] = useTransition();
  const [applyMessage, setApplyMessage] = useState<string | null>(null);

  const isImportDisabled = isPending || isProfileSaving || !selectedFile;
  const hasSuggestions = Boolean(state.suggestions);
  const hasSourceText = Boolean(state.extractedText);

  function handleExtract() {
    if (!selectedFile) {
      setState({
        formError: "Select a resume file to import.",
      });
      return;
    }

    setApplyMessage(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("resumeFile", selectedFile);
        const nextState = await importResumeText({}, formData);
        setState(nextState);
      } catch {
        setState({
          formError:
            "Resume import failed due to a network or server issue. Please try again.",
        });
      }
    });
  }

  function handleApplyToForm() {
    if (!state.suggestions || !state.extractedText) {
      return;
    }

    onApplySuggestions(state.suggestions);
    onApplyResumeSourceText(state.extractedText);
    setApplyMessage(
      "Imported profile suggestions applied to the draft form. Save changes to persist them.",
    );
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
        <h3 className="text-base font-semibold text-slate-950 dark:text-slate-100">
          Import resume
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Upload a file to generate profile suggestions.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="resumeFile" className="text-sm font-medium text-slate-950 dark:text-slate-100">
          Resume file
        </label>
        <input
          id="resumeFile"
          name="resumeFile"
          type="file"
          accept={ACCEPTED_FILE_TYPES}
          onChange={(event) => {
            const nextFile = event.currentTarget.files?.[0] ?? null;
            setSelectedFile(nextFile);
            setState(initialState);
            setApplyMessage(null);
          }}
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:file:bg-slate-100 dark:file:text-slate-950 dark:hover:file:bg-white"
        />
      </div>

      <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
        <p>Supported formats: .txt, .docx, .pdf</p>
        <p>Maximum file size: {MAX_UPLOAD_FILE_SIZE_MB} MB</p>
      </div>

      <div className="space-y-3">
        <Button
          type="button"
          variant="secondary"
          disabled={isImportDisabled}
          onClick={handleExtract}
        >
          {isPending ? "Importing resume..." : "Import resume"}
        </Button>

        {isPending ? (
          <p className="text-sm text-slate-600 dark:text-slate-300" role="status">
            Validating and extracting profile suggestions...
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

      {hasSuggestions && state.suggestions ? (
        <div className="space-y-4 rounded-md border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                Imported profile suggestions
              </h4>
            </div>
            <Button type="button" onClick={handleApplyToForm} disabled={isProfileSaving}>
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
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Target role
                </p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                  {state.suggestions.targetTitle}
                </p>
              </div>
            ) : null}
            {state.suggestions.yearsOfExperience ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
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
              <h4 className="text-sm font-medium text-slate-950 dark:text-slate-100">
                Experience summary
              </h4>
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
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Portfolio
                </p>
                <p className="mt-1 break-all text-sm text-slate-700 dark:text-slate-200">
                  {state.suggestions.portfolioUrl}
                </p>
              </div>
            ) : null}
            {state.suggestions.githubUrl ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  GitHub
                </p>
                <p className="mt-1 break-all text-sm text-slate-700 dark:text-slate-200">
                  {state.suggestions.githubUrl}
                </p>
              </div>
            ) : null}
            {state.suggestions.linkedinUrl ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  LinkedIn
                </p>
                <p className="mt-1 break-all text-sm text-slate-700 dark:text-slate-200">
                  {state.suggestions.linkedinUrl}
                </p>
              </div>
            ) : null}
          </div>

          {hasSourceText ? (
            <details className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/60">
              <summary className="cursor-pointer text-sm font-medium text-slate-800 dark:text-slate-200">
                Resume source text preview ({state.extractedTextLength?.toLocaleString() ?? 0} characters)
              </summary>
              <div className="mt-3">
                <Textarea
                  readOnly
                  rows={10}
                  value={state.extractedText}
                  className="font-mono text-xs"
                />
              </div>
            </details>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
