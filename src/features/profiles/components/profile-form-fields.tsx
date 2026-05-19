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

  return <p className="mt-1 text-sm text-red-600 dark:text-red-300">{errors[0]}</p>;
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
      <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/30">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-100">Profile Overview</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Define the role direction and job setup preferences for your search.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="targetTitleOption" className="text-sm font-medium text-slate-950 dark:text-slate-100">
              Target role
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
                  className="text-sm font-medium text-slate-950 dark:text-slate-100"
                >
                  Custom target role
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
            <label htmlFor="locationPreference" className="text-sm font-medium text-slate-950 dark:text-slate-100">
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
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Suggested phrases keep this globally useful without forcing a city list.
            </p>
            <FieldError errors={errors?.locationPreference} />
          </div>
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-slate-950 dark:text-slate-100">Work preferences</legend>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            {workPreferenceOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-start gap-3 rounded-md border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900"
              >
                <input
                  type="checkbox"
                  name="workPreferences"
                  value={option.value}
                  defaultChecked={defaultValues?.workPreferences?.includes(option.value)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-500"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-950 dark:text-slate-100">
                    {option.label}
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <FieldError errors={errors?.workPreferences} />
        </fieldset>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/30">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-100">Resume & AI Extraction</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Keep your latest resume text here so extraction suggestions can stay grounded.
          </p>
        </div>
        <div>
          <label htmlFor="resumeText" className="text-sm font-medium text-slate-950 dark:text-slate-100">
            Resume text
          </label>
          <Textarea
            id="resumeText"
            name="resumeText"
            rows={10}
            defaultValue={defaultValues?.resumeText}
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Paste plain-text resume content for future extraction and matching.
          </p>
          <FieldError errors={errors?.resumeText} />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/30">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-100">Skills & Experience</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Summarize your experience and core skills in a format that is easy to update.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="yearsOfExperience" className="text-sm font-medium text-slate-950 dark:text-slate-100">
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

          <div>
            <label htmlFor="skills" className="text-sm font-medium text-slate-950 dark:text-slate-100">
              Skills
            </label>
            <Textarea
              id="skills"
              name="skills"
              rows={5}
              defaultValue={defaultValues?.skills}
              placeholder="Project management, SQL, stakeholder communication&#10;A/B testing, user research"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Separate skills with commas or line breaks. Duplicates are removed when saved.
            </p>
            <FieldError errors={errors?.skills} />
          </div>
        </div>

        <div>
          <label htmlFor="experienceSummary" className="text-sm font-medium text-slate-950 dark:text-slate-100">
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
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/30">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-100">Career Links</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Add professional links you want to keep alongside your profile.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="portfolioUrl" className="text-sm font-medium text-slate-950 dark:text-slate-100">
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
            <label htmlFor="githubUrl" className="text-sm font-medium text-slate-950 dark:text-slate-100">
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
            <label htmlFor="linkedinUrl" className="text-sm font-medium text-slate-950 dark:text-slate-100">
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
      </section>
    </>
  );
}
