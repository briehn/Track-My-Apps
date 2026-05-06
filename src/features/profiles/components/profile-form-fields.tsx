import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ProfileFormFieldName =
  | "targetTitle"
  | "locationPreference"
  | "workPreference"
  | "yearsOfExperience"
  | "skills"
  | "experienceSummary"
  | "resumeText"
  | "portfolioUrl"
  | "githubUrl"
  | "linkedinUrl";

export type ProfileFormFieldErrors = Partial<Record<ProfileFormFieldName, string[]>>;

export type ProfileFormValues = Partial<Record<ProfileFormFieldName, string>>;

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

export function ProfileFormFields({ errors, defaultValues }: ProfileFormFieldsProps) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="targetTitle" className="text-sm font-medium text-slate-950">
            Target title
          </label>
          <Input
            id="targetTitle"
            name="targetTitle"
            autoComplete="organization-title"
            defaultValue={defaultValues?.targetTitle}
          />
          <FieldError errors={errors?.targetTitle} />
        </div>

        <div>
          <label htmlFor="yearsOfExperience" className="text-sm font-medium text-slate-950">
            Years of experience
          </label>
          <Input
            id="yearsOfExperience"
            name="yearsOfExperience"
            type="number"
            min="0"
            max="80"
            defaultValue={defaultValues?.yearsOfExperience}
          />
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
            defaultValue={defaultValues?.locationPreference}
          />
          <FieldError errors={errors?.locationPreference} />
        </div>

        <div>
          <label htmlFor="workPreference" className="text-sm font-medium text-slate-950">
            Work preference
          </label>
          <select
            id="workPreference"
            name="workPreference"
            defaultValue={defaultValues?.workPreference ?? ""}
            className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Not specified</option>
            <option value="ONSITE">Onsite</option>
            <option value="HYBRID">Hybrid</option>
            <option value="REMOTE">Remote</option>
          </select>
          <FieldError errors={errors?.workPreference} />
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
