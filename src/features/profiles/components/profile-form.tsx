"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProfileExtractionPanel } from "@/features/profiles/components/profile-extraction-panel";
import {
  ProfileFormFields,
  type ProfileFormValues,
} from "@/features/profiles/components/profile-form-fields";
import { ResumeUploadPanel } from "@/features/profiles/components/resume-upload-panel";
import {
  upsertProfile,
  type UpsertProfileActionState,
} from "@/features/profiles/actions";
import {
  isPredefinedTargetTitle,
  TARGET_TITLE_OTHER_OPTION,
  YEARS_OF_EXPERIENCE_OPTIONS,
  type YearsOfExperienceOption,
  yearsOfExperienceLabels,
} from "@/features/profiles/options";
import { mergeProfileExtractionSuggestionsIntoFormValues } from "@/features/profiles/suggestion-apply";
import { normalizeSkillsInput, type ProfileExtractionSuggestion } from "@/features/profiles/schemas";
import type { UserProfileDetail } from "@/features/profiles/queries";

type ProfileFormProps = {
  lastUpdatedLabel: string;
  profile: UserProfileDetail;
  viewerName: string | null;
};

const initialState: UpsertProfileActionState = {};

function toProfileFormValues(profile: UserProfileDetail): ProfileFormValues {
  if (!profile) {
    return {};
  }

  const usesCustomTargetTitle = !isPredefinedTargetTitle(profile.targetTitle);

  return {
    targetTitleOption: usesCustomTargetTitle
      ? TARGET_TITLE_OTHER_OPTION
      : (profile.targetTitle ?? undefined),
    targetTitleOther: usesCustomTargetTitle ? (profile.targetTitle ?? undefined) : undefined,
    locationPreference: profile.locationPreference ?? undefined,
    workPreferences: profile.workPreferences,
    yearsOfExperience: profile.yearsOfExperience ?? undefined,
    skills: profile.skills.join("\n"),
    experienceSummary: profile.experienceSummary ?? undefined,
    resumeText: profile.resumeText ?? undefined,
    portfolioUrl: profile.portfolioUrl ?? undefined,
    githubUrl: profile.githubUrl ?? undefined,
    linkedinUrl: profile.linkedinUrl ?? undefined,
  };
}

function normalizeFormValues(values: ProfileFormValues) {
  return {
    targetTitleOption: values.targetTitleOption ?? "",
    targetTitleOther: values.targetTitleOther ?? "",
    locationPreference: values.locationPreference ?? "",
    workPreferences: [...(values.workPreferences ?? [])].sort(),
    yearsOfExperience: values.yearsOfExperience ?? "",
    skills: values.skills ?? "",
    experienceSummary: values.experienceSummary ?? "",
    resumeText: values.resumeText ?? "",
    portfolioUrl: values.portfolioUrl ?? "",
    githubUrl: values.githubUrl ?? "",
    linkedinUrl: values.linkedinUrl ?? "",
  };
}

function toSnapshot(values: ProfileFormValues) {
  return JSON.stringify(normalizeFormValues(values));
}

function toCurrentFormValues(form: HTMLFormElement): ProfileFormValues {
  const formData = new FormData(form);

  return {
    targetTitleOption: formData.get("targetTitleOption")?.toString() ?? "",
    targetTitleOther: formData.get("targetTitleOther")?.toString() ?? "",
    locationPreference: formData.get("locationPreference")?.toString() ?? "",
    workPreferences: formData.getAll("workPreferences").map((value) => value.toString()),
    yearsOfExperience: formData.get("yearsOfExperience")?.toString() ?? "",
    skills: formData.get("skills")?.toString() ?? "",
    experienceSummary: formData.get("experienceSummary")?.toString() ?? "",
    resumeText: formData.get("resumeText")?.toString() ?? "",
    portfolioUrl: formData.get("portfolioUrl")?.toString() ?? "",
    githubUrl: formData.get("githubUrl")?.toString() ?? "",
    linkedinUrl: formData.get("linkedinUrl")?.toString() ?? "",
  };
}

function getTargetRoleLabel(values: ProfileFormValues) {
  if (values.targetTitleOption === TARGET_TITLE_OTHER_OPTION) {
    return values.targetTitleOther?.trim() || "Not specified";
  }

  return values.targetTitleOption?.trim() || "Not specified";
}

function buildCompletionItems(values: ProfileFormValues) {
  const hasAnyLink = Boolean(
    values.portfolioUrl?.trim() || values.githubUrl?.trim() || values.linkedinUrl?.trim(),
  );

  return [
    { label: "Target role", complete: Boolean(getTargetRoleLabel(values) !== "Not specified") },
    { label: "Experience range", complete: Boolean(values.yearsOfExperience?.trim()) },
    { label: "Location preference", complete: Boolean(values.locationPreference?.trim()) },
    { label: "Work preferences", complete: (values.workPreferences?.length ?? 0) > 0 },
    { label: "Skills", complete: normalizeSkillsInput(values.skills).length > 0 },
    { label: "Experience summary", complete: Boolean(values.experienceSummary?.trim()) },
    { label: "Career links", complete: hasAnyLink },
    { label: "Resume source text", complete: Boolean(values.resumeText?.trim()) },
  ];
}

function isYearsOfExperienceOption(
  value: string | undefined,
): value is YearsOfExperienceOption {
  return Boolean(
    value &&
      YEARS_OF_EXPERIENCE_OPTIONS.includes(value as YearsOfExperienceOption),
  );
}

export function ProfileForm({ lastUpdatedLabel, profile, viewerName }: ProfileFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const initialValues = useMemo(() => toProfileFormValues(profile), [profile]);
  const [draftValues, setDraftValues] = useState(initialValues);
  const [liveValues, setLiveValues] = useState(initialValues);
  const [resetKey, setResetKey] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [state, formAction, isPending] = useActionState(
    upsertProfile,
    initialState,
  );
  const initialSnapshot = useMemo(() => toSnapshot(initialValues), [initialValues]);

  useEffect(() => {
    if (!state.successMessage) {
      return;
    }

    router.refresh();
  }, [router, state.successMessage]);

  function updateDirtyState() {
    if (!formRef.current) {
      return;
    }

    const currentValues = toCurrentFormValues(formRef.current);
    const currentSnapshot = toSnapshot(currentValues);
    setLiveValues(currentValues);
    setIsDirty(currentSnapshot !== initialSnapshot);
  }

  function handleDiscardChanges() {
    setDraftValues(initialValues);
    setLiveValues(initialValues);
    setResetKey((value) => value + 1);
    setIsDirty(false);
  }

  function handleApplySuggestions(suggestions: ProfileExtractionSuggestion) {
    const currentValues = formRef.current
      ? toCurrentFormValues(formRef.current)
      : draftValues;
    const nextValues = mergeProfileExtractionSuggestionsIntoFormValues(
      currentValues,
      suggestions,
    );

    setDraftValues(nextValues);
    setLiveValues(nextValues);
    setResetKey((value) => value + 1);
    setIsDirty(toSnapshot(nextValues) !== initialSnapshot);
  }

  function handleApplyResumeSourceText(extractedText: string) {
    const currentValues = formRef.current
      ? toCurrentFormValues(formRef.current)
      : draftValues;
    const nextValues = {
      ...currentValues,
      resumeText: extractedText,
    };

    setDraftValues(nextValues);
    setLiveValues(nextValues);
    setResetKey((value) => value + 1);
    setIsDirty(toSnapshot(nextValues) !== initialSnapshot);
  }

  const completionItems = useMemo(() => buildCompletionItems(liveValues), [liveValues]);
  const completedCount = completionItems.filter((item) => item.complete).length;
  const completionPercent = Math.round((completedCount / completionItems.length) * 100);
  const workPreferenceChipValues = liveValues.workPreferences ?? [];
  const workPreferenceLabelMap: Record<string, string> = {
    ONSITE: "Onsite",
    HYBRID: "Hybrid",
    REMOTE: "Remote",
  };
  const viewerLabel = viewerName?.trim() || "Career Profile";
  const skillsChipValues = normalizeSkillsInput(liveValues.skills).slice(0, 8);
  const hasMoreSkills = normalizeSkillsInput(liveValues.skills).length > skillsChipValues.length;

  return (
    <form
      id="career-profile-form"
      ref={formRef}
      action={formAction}
      onChange={updateDirtyState}
      className="scroll-mt-24 space-y-6 pb-28"
      aria-labelledby="career-profile-form-title"
    >
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

      <section className="space-y-5 rounded-2xl bg-slate-100/70 p-5 dark:bg-slate-900/35 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
              {viewerLabel}
            </h2>
          </div>
          <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Last updated {lastUpdatedLabel}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg bg-white px-3 py-3 shadow-sm dark:bg-slate-900">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Target role
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
              {getTargetRoleLabel(liveValues)}
            </p>
          </div>
          <div className="rounded-lg bg-white px-3 py-3 shadow-sm dark:bg-slate-900">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Experience
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
              {liveValues.yearsOfExperience
                ? isYearsOfExperienceOption(liveValues.yearsOfExperience)
                  ? yearsOfExperienceLabels[liveValues.yearsOfExperience]
                  : "Not specified"
                : "Not specified"}
            </p>
          </div>
          <div className="rounded-lg bg-white px-3 py-3 shadow-sm dark:bg-slate-900">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Location
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
              {liveValues.locationPreference?.trim() || "Not specified"}
            </p>
          </div>
          <div className="rounded-lg bg-white px-3 py-3 shadow-sm dark:bg-slate-900">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Profile status
            </p>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant={isDirty ? "warning" : "success"}>
                {isDirty ? "Draft changes" : "Saved"}
              </Badge>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {completionPercent}% complete
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {workPreferenceChipValues.length > 0 ? (
            workPreferenceChipValues.map((value) => (
              <Badge key={value} variant="info">
                {workPreferenceLabelMap[value] ?? value}
              </Badge>
            ))
          ) : (
            <Badge variant="neutral">No work preferences set</Badge>
          )}
          {skillsChipValues.map((skill) => (
            <Badge key={skill} variant="neutral">
              {skill}
            </Badge>
          ))}
          {hasMoreSkills ? <Badge variant="neutral">+ more skills</Badge> : null}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <ProfileFormFields
            key={resetKey}
            errors={state.fieldErrors}
            defaultValues={draftValues}
          />
        </div>

        <aside className="space-y-6 rounded-2xl bg-slate-100/60 p-4 dark:bg-slate-900/30 md:p-5">
          <section className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-950 dark:text-slate-100">
                Profile tools
              </h3>
            </div>

            <ResumeUploadPanel
              className="border-slate-200/80 bg-white/90 dark:border-slate-700 dark:bg-slate-900/75"
              isProfileSaving={isPending}
              onApplySuggestions={handleApplySuggestions}
              onApplyResumeSourceText={handleApplyResumeSourceText}
            />

            <ProfileExtractionPanel
              className="border-slate-200/80 bg-white/90 dark:border-slate-700 dark:bg-slate-900/75"
              hasSavedResumeText={Boolean(profile?.resumeText?.trim())}
              savedResumeTextLength={profile?.resumeText?.length ?? 0}
              isProfileDirty={isDirty}
              isProfileSaving={isPending}
              onApplySuggestions={handleApplySuggestions}
            />
          </section>

          <section className="space-y-4 border-t border-slate-200/80 pt-5 dark:border-slate-700/80">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-950 dark:text-slate-100">
                Profile completeness
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {completedCount}/{completionItems.length} signals filled
              </p>
            </div>
            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-teal-600 transition-all dark:bg-teal-400"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <div className="grid gap-2">
              {completionItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-md bg-white/85 px-3 py-2 dark:bg-slate-900/70"
                >
                  <span className="text-sm text-slate-700 dark:text-slate-200">{item.label}</span>
                  <Badge variant={item.complete ? "success" : "neutral"}>
                    {item.complete ? "Done" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3 border-t border-slate-200/80 pt-5 dark:border-slate-700/80">
            <h3 className="text-base font-semibold text-slate-950 dark:text-slate-100">
              Resume source text
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Used for extraction, matching, and interview prep.
            </p>
            <details className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/60">
              <summary className="cursor-pointer text-sm font-medium text-slate-900 dark:text-slate-100">
                View or edit resume source text
              </summary>
              <div className="mt-3">
                <textarea
                  id="resumeText"
                  name="resumeText"
                  rows={10}
                  defaultValue={draftValues.resumeText}
                  className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                />
                {state.fieldErrors?.resumeText?.[0] ? (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                    {state.fieldErrors.resumeText[0]}
                  </p>
                ) : null}
              </div>
            </details>
          </section>
        </aside>
      </div>

      {isDirty ? (
        <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-3xl -translate-x-1/2 rounded-xl border border-slate-300 bg-white/95 p-3 shadow-[0_12px_36px_rgba(15,23,42,0.18)] backdrop-blur sm:w-[calc(100%-2rem)] dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-[0_16px_42px_rgba(2,6,23,0.7)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-700 dark:text-slate-200">
              {isPending ? "Saving changes..." : "You have unsaved changes."}
            </p>
            <div className="flex gap-2 sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={handleDiscardChanges}
                disabled={isPending}
              >
                Discard changes
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
