"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  ProfileFormFields,
  type ProfileFormValues,
} from "@/features/profiles/components/profile-form-fields";
import {
  upsertProfile,
  type UpsertProfileActionState,
} from "@/features/profiles/actions";
import type { UserProfileDetail } from "@/features/profiles/queries";

type ProfileFormProps = {
  profile: UserProfileDetail;
};

const initialState: UpsertProfileActionState = {};

function toProfileFormValues(profile: UserProfileDetail): ProfileFormValues {
  if (!profile) {
    return {};
  }

  return {
    targetTitle: profile.targetTitle ?? undefined,
    locationPreference: profile.locationPreference ?? undefined,
    workPreference: profile.workPreference ?? undefined,
    yearsOfExperience: profile.yearsOfExperience?.toString(),
    skills: profile.skills.join("\n"),
    experienceSummary: profile.experienceSummary ?? undefined,
    resumeText: profile.resumeText ?? undefined,
    portfolioUrl: profile.portfolioUrl ?? undefined,
    githubUrl: profile.githubUrl ?? undefined,
    linkedinUrl: profile.linkedinUrl ?? undefined,
  };
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    upsertProfile,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
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

      <ProfileFormFields
        errors={state.fieldErrors}
        defaultValues={toProfileFormValues(profile)}
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
