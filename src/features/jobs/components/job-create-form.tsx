"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createJob, type CreateJobActionState } from "@/features/jobs/actions";

const initialState: CreateJobActionState = {};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="mt-1 text-sm text-red-600">{errors[0]}</p>;
}

export function JobCreateForm() {
  const [state, formAction, isPending] = useActionState(
    createJob,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      {state.formError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.formError}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="company"
            className="text-sm font-medium text-slate-950"
          >
            Company
          </label>
          <Input id="company" name="company" autoComplete="organization" />
          <FieldError errors={state.fieldErrors?.company} />
        </div>

        <div>
          <label htmlFor="title" className="text-sm font-medium text-slate-950">
            Job title
          </label>
          <Input id="title" name="title" autoComplete="organization-title" />
          <FieldError errors={state.fieldErrors?.title} />
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
          <Input id="location" name="location" autoComplete="address-level2" />
          <FieldError errors={state.fieldErrors?.location} />
        </div>

        <div>
          <label htmlFor="url" className="text-sm font-medium text-slate-950">
            Job URL
          </label>
          <Input id="url" name="url" type="url" placeholder="https://..." />
          <FieldError errors={state.fieldErrors?.url} />
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
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Not specified</option>
            <option value="ONSITE">Onsite</option>
            <option value="HYBRID">Hybrid</option>
            <option value="REMOTE">Remote</option>
          </select>
          <FieldError errors={state.fieldErrors?.remoteType} />
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
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Not specified</option>
            <option value="FULL_TIME">Full-time</option>
            <option value="PART_TIME">Part-time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="TEMPORARY">Temporary</option>
          </select>
          <FieldError errors={state.fieldErrors?.employmentType} />
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
          <Input id="salaryMin" name="salaryMin" type="number" min="0" />
          <FieldError errors={state.fieldErrors?.salaryMin} />
        </div>

        <div>
          <label
            htmlFor="salaryMax"
            className="text-sm font-medium text-slate-950"
          >
            Salary max
          </label>
          <Input id="salaryMax" name="salaryMax" type="number" min="0" />
          <FieldError errors={state.fieldErrors?.salaryMax} />
        </div>

        <div>
          <label
            htmlFor="salaryCurrency"
            className="text-sm font-medium text-slate-950"
          >
            Currency
          </label>
          <Input id="salaryCurrency" name="salaryCurrency" placeholder="USD" />
          <FieldError errors={state.fieldErrors?.salaryCurrency} />
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
          <Input id="source" name="source" placeholder="LinkedIn, company site" />
          <FieldError errors={state.fieldErrors?.source} />
        </div>

        <div>
          <label
            htmlFor="deadline"
            className="text-sm font-medium text-slate-950"
          >
            Application deadline
          </label>
          <Input id="deadline" name="deadline" type="date" />
          <FieldError errors={state.fieldErrors?.deadline} />
        </div>
      </div>

      <div>
        <label
          htmlFor="description"
          className="text-sm font-medium text-slate-950"
        >
          Job description
        </label>
        <Textarea id="description" name="description" />
        <FieldError errors={state.fieldErrors?.description} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save job"}
        </Button>
      </div>
    </form>
  );
}
