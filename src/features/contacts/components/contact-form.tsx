"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createJobContact,
  updateJobContact,
  type ContactActionState,
} from "@/features/contacts/actions";
import {
  JOB_CONTACT_TYPES,
  OUTREACH_STATUSES,
  jobContactTypeLabels,
  outreachStatusLabels,
} from "@/features/contacts/options";
import type { JobContact } from "@/features/contacts/queries";

type ContactFormProps = {
  jobId: string;
  defaultCompany: string;
  contact?: JobContact;
};

const initialState: ContactActionState = {};

function toDateInputValue(date: Date | null | undefined) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function ContactForm({ jobId, defaultCompany, contact }: ContactFormProps) {
  const isEditing = Boolean(contact);
  const [state, formAction, isPending] = useActionState(
    isEditing ? updateJobContact : createJobContact,
    initialState,
  );
  const fieldId = (name: string) => `${isEditing ? `contact-${contact?.id}` : "new-contact"}-${name}`;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="jobId" value={jobId} />
      {contact ? <input type="hidden" name="contactId" value={contact.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={fieldId("name")} className="text-sm font-medium text-slate-950 dark:text-slate-100">
            Name
          </label>
          <Input id={fieldId("name")} name="name" defaultValue={contact?.name} required />
          {state.fieldErrors?.name?.[0] ? <p className="mt-1 text-sm text-red-600">{state.fieldErrors.name[0]}</p> : null}
        </div>
        <div>
          <label htmlFor={fieldId("contactType")} className="text-sm font-medium text-slate-950 dark:text-slate-100">
            Contact type
          </label>
          <select
            id={fieldId("contactType")}
            name="contactType"
            defaultValue={contact?.contactType ?? "RECRUITER"}
            className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-700"
          >
            {JOB_CONTACT_TYPES.map((contactType) => <option key={contactType} value={contactType}>{jobContactTypeLabels[contactType]}</option>)}
          </select>
          {state.fieldErrors?.contactType?.[0] ? <p className="mt-1 text-sm text-red-600">{state.fieldErrors.contactType[0]}</p> : null}
        </div>
        <div>
          <label htmlFor={fieldId("title")} className="text-sm font-medium text-slate-950 dark:text-slate-100">Role / title</label>
          <Input id={fieldId("title")} name="title" defaultValue={contact?.title ?? ""} placeholder="Engineering Manager" />
        </div>
        <div>
          <label htmlFor={fieldId("company")} className="text-sm font-medium text-slate-950 dark:text-slate-100">Company</label>
          <Input id={fieldId("company")} name="company" defaultValue={contact?.company ?? defaultCompany} />
        </div>
        <div>
          <label htmlFor={fieldId("profileUrl")} className="text-sm font-medium text-slate-950 dark:text-slate-100">Profile URL <span className="font-normal text-slate-500">(optional)</span></label>
          <Input id={fieldId("profileUrl")} name="profileUrl" type="url" defaultValue={contact?.profileUrl ?? ""} placeholder="https://..." />
          {state.fieldErrors?.profileUrl?.[0] ? <p className="mt-1 text-sm text-red-600">{state.fieldErrors.profileUrl[0]}</p> : null}
        </div>
        <div>
          <label htmlFor={fieldId("email")} className="text-sm font-medium text-slate-950 dark:text-slate-100">Email <span className="font-normal text-slate-500">(optional)</span></label>
          <Input id={fieldId("email")} name="email" type="email" defaultValue={contact?.email ?? ""} />
          {state.fieldErrors?.email?.[0] ? <p className="mt-1 text-sm text-red-600">{state.fieldErrors.email[0]}</p> : null}
        </div>
        <div>
          <label htmlFor={fieldId("outreachStatus")} className="text-sm font-medium text-slate-950 dark:text-slate-100">Outreach status</label>
          <select id={fieldId("outreachStatus")} name="outreachStatus" defaultValue={contact?.outreachStatus ?? "NOT_CONTACTED"} className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-700">
            {OUTREACH_STATUSES.map((status) => <option key={status} value={status}>{outreachStatusLabels[status]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={fieldId("lastContactedAt")} className="text-sm font-medium text-slate-950 dark:text-slate-100">Last contacted <span className="font-normal text-slate-500">(optional)</span></label>
          <Input id={fieldId("lastContactedAt")} name="lastContactedAt" type="date" defaultValue={toDateInputValue(contact?.lastContactedAt)} />
        </div>
        <div>
          <label htmlFor={fieldId("followUpAt")} className="text-sm font-medium text-slate-950 dark:text-slate-100">Follow-up <span className="font-normal text-slate-500">(optional)</span></label>
          <Input id={fieldId("followUpAt")} name="followUpAt" type="date" defaultValue={toDateInputValue(contact?.followUpAt)} />
        </div>
      </div>

      <div>
        <label htmlFor={fieldId("relevanceNotes")} className="text-sm font-medium text-slate-950 dark:text-slate-100">Why they are relevant <span className="font-normal text-slate-500">(optional)</span></label>
        <Textarea id={fieldId("relevanceNotes")} name="relevanceNotes" className="min-h-20" defaultValue={contact?.relevanceNotes ?? ""} placeholder="For example, they work on the team or are a former colleague." />
      </div>
      <div>
        <label htmlFor={fieldId("notes")} className="text-sm font-medium text-slate-950 dark:text-slate-100">Outreach notes <span className="font-normal text-slate-500">(optional)</span></label>
        <Textarea id={fieldId("notes")} name="notes" className="min-h-20" defaultValue={contact?.notes ?? ""} placeholder="Keep a concise record of what you discussed or plan to send." />
      </div>
      {state.formError ? <p className="text-sm text-red-600" role="alert">{state.formError}</p> : null}
      <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : isEditing ? "Save contact" : "Add contact"}</Button>
    </form>
  );
}
