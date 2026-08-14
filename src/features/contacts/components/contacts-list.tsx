"use client";

import { useActionState, useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContactSheet } from "@/features/contacts/components/contact-sheet";
import { deleteJobContact, updateOutreachStatus, type ContactActionState } from "@/features/contacts/actions";
import { OUTREACH_STATUSES, jobContactTypeLabels, outreachStatusLabels } from "@/features/contacts/options";
import type { JobContact } from "@/features/contacts/queries";

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
      <select id={`contact-${contact.id}-status`} name="outreachStatus" defaultValue={contact.outreachStatus} disabled={isPending} onChange={() => formRef.current?.requestSubmit()} className="h-8 max-w-40 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-950 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-700">
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
    <div className="divide-y divide-slate-200/80 border-y border-slate-200/80 dark:divide-slate-800 dark:border-slate-800">
      {contacts.map((contact) => {
        const followUpLabel = formatDate(contact.followUpAt);

        return (
          <article key={contact.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-slate-950 dark:text-slate-100">{contact.name}</h3>
                  <Badge variant="neutral">{jobContactTypeLabels[contact.contactType]}</Badge>
                </div>
                <p className="mt-0.5 truncate text-sm text-slate-600 dark:text-slate-400">{[contact.title, contact.company].filter(Boolean).join(" · ") || "Role not added"}</p>
                {followUpLabel ? <p className="mt-1 text-sm font-medium text-amber-800 dark:text-amber-300">Follow up {followUpLabel}</p> : null}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <ContactStatusForm jobId={jobId} contact={contact} />
                <ContactSheet jobId={jobId} company={company} contact={contact} />
                <DeleteContactForm jobId={jobId} contactId={contact.id} />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
