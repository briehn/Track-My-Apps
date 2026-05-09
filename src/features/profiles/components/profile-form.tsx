"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ProfileExtractionPanel } from "@/features/profiles/components/profile-extraction-panel";
import {
  ProfileFormFields,
  type ProfileFormValues,
} from "@/features/profiles/components/profile-form-fields";
import {
  upsertProfile,
  type UpsertProfileActionState,
} from "@/features/profiles/actions";
import { isPredefinedTargetTitle, TARGET_TITLE_OTHER_OPTION } from "@/features/profiles/options";
import { mergeProfileExtractionSuggestionsIntoFormValues } from "@/features/profiles/suggestion-apply";
import type { ProfileExtractionSuggestion } from "@/features/profiles/schemas";
import type { UserProfileDetail } from "@/features/profiles/queries";

type ProfileFormProps = {
  profile: UserProfileDetail;
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

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const initialValues = useMemo(() => toProfileFormValues(profile), [profile]);
  const [draftValues, setDraftValues] = useState(initialValues);
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

    const currentSnapshot = toSnapshot(toCurrentFormValues(formRef.current));
    setIsDirty(currentSnapshot !== initialSnapshot);
  }

  function handleDiscardChanges() {
    setDraftValues(initialValues);
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
    setResetKey((value) => value + 1);
    setIsDirty(toSnapshot(nextValues) !== initialSnapshot);
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onChange={updateDirtyState}
      className="space-y-6 pb-28"
    >
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

      <ProfileExtractionPanel
        hasSavedResumeText={Boolean(profile?.resumeText?.trim())}
        savedResumeTextLength={profile?.resumeText?.length ?? 0}
        isProfileDirty={isDirty}
        isProfileSaving={isPending}
        onApplySuggestions={handleApplySuggestions}
      />

      <ProfileFormFields
        key={resetKey}
        errors={state.fieldErrors}
        defaultValues={draftValues}
      />

      {isDirty ? (
        <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-3xl -translate-x-1/2 rounded-lg border border-slate-300 bg-white/95 p-3 shadow-xl backdrop-blur sm:w-[calc(100%-2rem)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-700">
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
