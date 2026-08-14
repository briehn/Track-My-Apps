"use client";

import { useActionState, useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/features/contacts/components/contact-form";
import {
  deleteJobContact,
  updateOutreachStatus,
  type ContactActionState,
} from "@/features/contacts/actions";
import {
  OUTREACH_STATUSES,
  contactTypeRelevance,
  jobContactTypeLabels,
  outreachStatusLabels,
} from "@/features/contacts/options";
import type { JobContact } from "@/features/contacts/queries";
import { isSafeExternalUrl } from "@/lib/url";

type ContactsListProps = {
  jobId: string;
  company: string;
  contacts: JobContact[];
};

const dateFormatter = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });

function formatDate(date: Date | null) {
  return date ? dateFormatter.format(date) : null;
}

function ContactStatusForm({ jobId, contact }: { jobId: string; contact: JobContact }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<ContactActionState, FormData>(updateOutreachStatus, {});

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="contactId" value={contact.id} />
      <label htmlFor={`contact-${contact.id}-status`} className="sr-only">Outreach status for {contact.name}</label>
      <select id={`contact-${contact.id}-status`} name="outreachStatus" defaultValue={contact.outreachStatus} disabled={isPending} onChange={() => formRef.current?.requestSubmit()} className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-950 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-700">
        {OUTREACH_STATUSES.map((status) => <option key={status} value={status}>{outreachStatusLabels[status]}</option>)}
      </select>
      {state.formError ? <p className="text-xs text-red-600" role="alert">{state.formError}</p> : null}
    </form>
  );
}

function DeleteContactForm({ jobId, contactId }: { jobId: string; contactId: string }) {
  const [state, formAction, isPending] = useActionState<ContactActionState, FormData>(deleteJobContact, {});

  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="contactId" value={contactId} />
      <Button type="submit" variant="ghost" size="xs" disabled={isPending} className="text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40">{isPending ? "Deleting..." : "Delete"}</Button>
      {state.formError ? <p className="text-xs text-red-600" role="alert">{state.formError}</p> : null}
    </form>
  );
}

export function ContactsList({ jobId, company, contacts }: ContactsListProps) {
  return (
    <div className="space-y-3">
      {contacts.map((contact) => {
        const safeProfileUrl = contact.profileUrl && isSafeExternalUrl(contact.profileUrl) ? contact.profileUrl : null;
        const followUpLabel = formatDate(contact.followUpAt);

        return (
          <article key={contact.id} className="rounded-2xl bg-slate-100/70 p-4 dark:bg-slate-900/60">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-slate-950 dark:text-slate-100">{contact.name}</h3>
                  <Badge variant="neutral">{jobContactTypeLabels[contact.contactType]}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{[contact.title, contact.company].filter(Boolean).join(" · ") || "Role not added"}</p>
              </div>
              <ContactStatusForm jobId={jobId} contact={contact} />
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {followUpLabel ? <p className="font-medium text-amber-800 dark:text-amber-300">Follow up {followUpLabel}</p> : null}
              {contact.lastContactedAt ? <p className="text-slate-600 dark:text-slate-400">Last contacted {formatDate(contact.lastContactedAt)}</p> : null}
              {safeProfileUrl ? <a href={safeProfileUrl} target="_blank" rel="noreferrer" className="font-medium text-slate-950 underline underline-offset-4 hover:text-slate-700 dark:text-slate-100 dark:hover:text-slate-300">Open profile</a> : null}
              {contact.email ? <a href={`mailto:${contact.email}`} className="font-medium text-slate-950 underline underline-offset-4 hover:text-slate-700 dark:text-slate-100 dark:hover:text-slate-300">Email</a> : null}
            </div>

            <details className="mt-3 border-t border-slate-200/80 pt-3 dark:border-slate-800">
              <summary className="cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-100">View details and edit</summary>
              <div className="mt-4 space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">{contact.relevanceNotes ?? contactTypeRelevance[contact.contactType]}</p>
                {contact.notes ? <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">{contact.notes}</p> : null}
                <ContactForm jobId={jobId} defaultCompany={company} contact={contact} />
                <DeleteContactForm jobId={jobId} contactId={contact.id} />
              </div>
            </details>
          </article>
        );
      })}
    </div>
  );
}
