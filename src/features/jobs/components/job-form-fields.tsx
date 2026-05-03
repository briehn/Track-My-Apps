import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type JobFormFieldName =
  | "company"
  | "title"
  | "location"
  | "remoteType"
  | "employmentType"
  | "source"
  | "url"
  | "salaryMin"
  | "salaryMax"
  | "salaryCurrency"
  | "description"
  | "deadline";

export type JobFormFieldErrors = Partial<Record<JobFormFieldName, string[]>>;

export type JobFormValues = Partial<Record<JobFormFieldName, string>>;

type JobFormFieldsProps = {
  errors?: JobFormFieldErrors;
  defaultValues?: JobFormValues;
};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="mt-1 text-sm text-red-600">{errors[0]}</p>;
}

export function JobFormFields({ errors, defaultValues }: JobFormFieldsProps) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="company"
            className="text-sm font-medium text-slate-950"
          >
            Company
          </label>
          <Input
            id="company"
            name="company"
            autoComplete="organization"
            defaultValue={defaultValues?.company}
          />
          <FieldError errors={errors?.company} />
        </div>

        <div>
          <label htmlFor="title" className="text-sm font-medium text-slate-950">
            Job title
          </label>
          <Input
            id="title"
            name="title"
            autoComplete="organization-title"
            defaultValue={defaultValues?.title}
          />
          <FieldError errors={errors?.title} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="location"
            className="text-sm font-medium text-slate-950"
          >
            Location
          </label>
          <Input
            id="location"
            name="location"
            autoComplete="address-level2"
            defaultValue={defaultValues?.location}
          />
          <FieldError errors={errors?.location} />
        </div>

        <div>
          <label htmlFor="url" className="text-sm font-medium text-slate-950">
            Job URL
          </label>
          <Input
            id="url"
            name="url"
            type="url"
            placeholder="https://..."
            defaultValue={defaultValues?.url}
          />
          <FieldError errors={errors?.url} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="remoteType"
            className="text-sm font-medium text-slate-950"
          >
            Work mode
          </label>
          <select
            id="remoteType"
            name="remoteType"
            defaultValue={defaultValues?.remoteType ?? ""}
            className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Not specified</option>
            <option value="ONSITE">Onsite</option>
            <option value="HYBRID">Hybrid</option>
            <option value="REMOTE">Remote</option>
          </select>
          <FieldError errors={errors?.remoteType} />
        </div>

        <div>
          <label
            htmlFor="employmentType"
            className="text-sm font-medium text-slate-950"
          >
            Employment type
          </label>
          <select
            id="employmentType"
            name="employmentType"
            defaultValue={defaultValues?.employmentType ?? ""}
            className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Not specified</option>
            <option value="FULL_TIME">Full-time</option>
            <option value="PART_TIME">Part-time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="TEMPORARY">Temporary</option>
          </select>
          <FieldError errors={errors?.employmentType} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label
            htmlFor="salaryMin"
            className="text-sm font-medium text-slate-950"
          >
            Salary min
          </label>
          <Input
            id="salaryMin"
            name="salaryMin"
            type="number"
            min="0"
            defaultValue={defaultValues?.salaryMin}
          />
          <FieldError errors={errors?.salaryMin} />
        </div>

        <div>
          <label
            htmlFor="salaryMax"
            className="text-sm font-medium text-slate-950"
          >
            Salary max
          </label>
          <Input
            id="salaryMax"
            name="salaryMax"
            type="number"
            min="0"
            defaultValue={defaultValues?.salaryMax}
          />
          <FieldError errors={errors?.salaryMax} />
        </div>

        <div>
          <label
            htmlFor="salaryCurrency"
            className="text-sm font-medium text-slate-950"
          >
            Currency
          </label>
          <Input
            id="salaryCurrency"
            name="salaryCurrency"
            placeholder="USD"
            defaultValue={defaultValues?.salaryCurrency}
          />
          <FieldError errors={errors?.salaryCurrency} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="source"
            className="text-sm font-medium text-slate-950"
          >
            Source
          </label>
          <Input
            id="source"
            name="source"
            placeholder="LinkedIn, company site"
            defaultValue={defaultValues?.source}
          />
          <FieldError errors={errors?.source} />
        </div>

        <div>
          <label
            htmlFor="deadline"
            className="text-sm font-medium text-slate-950"
          >
            Application deadline
          </label>
          <Input
            id="deadline"
            name="deadline"
            type="date"
            defaultValue={defaultValues?.deadline}
          />
          <FieldError errors={errors?.deadline} />
        </div>
      </div>

      <div>
        <label
          htmlFor="description"
          className="text-sm font-medium text-slate-950"
        >
          Job description
        </label>
        <Textarea
          id="description"
          name="description"
          defaultValue={defaultValues?.description}
        />
        <FieldError errors={errors?.description} />
      </div>
    </>
  );
}
