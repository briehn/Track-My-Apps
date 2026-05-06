"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  locationPreferenceSuggestions,
  TARGET_TITLE_OPTIONS,
  TARGET_TITLE_OTHER_OPTION,
  yearsOfExperienceLabels,
  YEARS_OF_EXPERIENCE_OPTIONS,
  workPreferenceOptions,
} from "@/features/profiles/options";
import { ProfileSelect } from "@/features/profiles/components/profile-select";
import type { ProfileFormFieldName } from "@/features/profiles/schemas";

export type ProfileFormFieldErrors = Partial<Record<ProfileFormFieldName, string[]>>;

export type ProfileFormValues = {
  targetTitleOption?: string;
  targetTitleOther?: string;
  locationPreference?: string;
  workPreferences?: string[];
  yearsOfExperience?: string;
  skills?: string;
  experienceSummary?: string;
  resumeText?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
};

type ProfileFormFieldsProps = {
  errors?: ProfileFormFieldErrors;
  defaultValues?: ProfileFormValues;
};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="mt-1 text-sm text-red-600">{errors[0]}</p>;
}

export function ProfileFormFields({
  errors,
  defaultValues,
}: ProfileFormFieldsProps) {
  const [targetTitleOption, setTargetTitleOption] = useState(
    defaultValues?.targetTitleOption ?? "",
  );

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="targetTitleOption" className="text-sm font-medium text-slate-950">
            Target title
          </label>
          <ProfileSelect
            id="targetTitleOption"
            name="targetTitleOption"
            defaultValue={defaultValues?.targetTitleOption ?? ""}
            onChange={(event) => setTargetTitleOption(event.currentTarget.value)}
          >
            <option value="">Not specified</option>
            {TARGET_TITLE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            <option value={TARGET_TITLE_OTHER_OPTION}>Other</option>
          </ProfileSelect>
          <FieldError errors={errors?.targetTitleOption} />

          {targetTitleOption === TARGET_TITLE_OTHER_OPTION ? (
            <div className="mt-3">
              <label
                htmlFor="targetTitleOther"
                className="text-sm font-medium text-slate-950"
              >
                Custom target title
              </label>
              <Input
                id="targetTitleOther"
                name="targetTitleOther"
                autoComplete="organization-title"
                defaultValue={defaultValues?.targetTitleOther}
              />
              <FieldError errors={errors?.targetTitleOther} />
            </div>
          ) : null}
        </div>

        <div>
          <label htmlFor="yearsOfExperience" className="text-sm font-medium text-slate-950">
            Years of experience
          </label>
          <ProfileSelect
            id="yearsOfExperience"
            name="yearsOfExperience"
            defaultValue={defaultValues?.yearsOfExperience}
          >
            <option value="">Not specified</option>
            {YEARS_OF_EXPERIENCE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {yearsOfExperienceLabels[option]}
              </option>
            ))}
          </ProfileSelect>
          <FieldError errors={errors?.yearsOfExperience} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="locationPreference" className="text-sm font-medium text-slate-950">
            Location preference
          </label>
          <Input
            id="locationPreference"
            name="locationPreference"
            autoComplete="address-level2"
            list="location-preference-suggestions"
            defaultValue={defaultValues?.locationPreference}
          />
          <datalist id="location-preference-suggestions">
            {locationPreferenceSuggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
          <p className="mt-1 text-xs text-slate-500">
            Suggested phrases keep this usable globally without restricting you to a hard-coded city list.
          </p>
          <FieldError errors={errors?.locationPreference} />
        </div>

        <div>
          <fieldset>
            <legend className="text-sm font-medium text-slate-950">Work preferences</legend>
            <div className="mt-2 space-y-2">
              {workPreferenceOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3"
                >
                  <input
                    type="checkbox"
                    name="workPreferences"
                    value={option.value}
                    defaultChecked={defaultValues?.workPreferences?.includes(option.value)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-400"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-950">
                      {option.label}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {option.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <FieldError errors={errors?.workPreferences} />
          </fieldset>
        </div>
      </div>

      <div>
        <label htmlFor="skills" className="text-sm font-medium text-slate-950">
          Skills
        </label>
        <Textarea
          id="skills"
          name="skills"
          rows={5}
          defaultValue={defaultValues?.skills}
          placeholder="TypeScript, React, SQL&#10;Accessibility"
        />
        <p className="mt-1 text-xs text-slate-500">
          Separate skills with commas or line breaks. Duplicates are removed when saved.
        </p>
        <FieldError errors={errors?.skills} />
      </div>

      <div>
        <label htmlFor="experienceSummary" className="text-sm font-medium text-slate-950">
          Experience summary
        </label>
        <Textarea
          id="experienceSummary"
          name="experienceSummary"
          rows={6}
          defaultValue={defaultValues?.experienceSummary}
        />
        <FieldError errors={errors?.experienceSummary} />
      </div>

      <div>
        <label htmlFor="resumeText" className="text-sm font-medium text-slate-950">
          Resume text
        </label>
        <Textarea
          id="resumeText"
          name="resumeText"
          rows={10}
          defaultValue={defaultValues?.resumeText}
        />
        <p className="mt-1 text-xs text-slate-500">
          Paste the current plain-text resume content you want future matching to use.
        </p>
        <FieldError errors={errors?.resumeText} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="portfolioUrl" className="text-sm font-medium text-slate-950">
            Portfolio URL
          </label>
          <Input
            id="portfolioUrl"
            name="portfolioUrl"
            type="url"
            placeholder="https://..."
            defaultValue={defaultValues?.portfolioUrl}
          />
          <FieldError errors={errors?.portfolioUrl} />
        </div>

        <div>
          <label htmlFor="githubUrl" className="text-sm font-medium text-slate-950">
            GitHub URL
          </label>
          <Input
            id="githubUrl"
            name="githubUrl"
            type="url"
            placeholder="https://github.com/..."
            defaultValue={defaultValues?.githubUrl}
          />
          <FieldError errors={errors?.githubUrl} />
        </div>

        <div>
          <label htmlFor="linkedinUrl" className="text-sm font-medium text-slate-950">
            LinkedIn URL
          </label>
          <Input
            id="linkedinUrl"
            name="linkedinUrl"
            type="url"
            placeholder="https://www.linkedin.com/in/..."
            defaultValue={defaultValues?.linkedinUrl}
          />
          <FieldError errors={errors?.linkedinUrl} />
        </div>
      </div>
    </>
  );
}
