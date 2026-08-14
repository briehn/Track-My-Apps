import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactSheet } from "@/features/contacts/components/contact-sheet";
import { ContactsList } from "@/features/contacts/components/contacts-list";
import { getNetworkingSearchSuggestions, getWebSearchUrl } from "@/features/contacts/search-suggestions";
import type { JobContact } from "@/features/contacts/queries";

type NetworkingCardProps = {
  jobId: string;
  company: string;
  title: string;
  contacts: JobContact[];
};

const searchActionLabels = {
  RECRUITER: "Recruiters",
  HIRING_MANAGER: "Hiring managers",
  ENGINEER: "Engineers",
  CONNECTION: "Connections",
  LEADERSHIP: "Leaders",
  OTHER: "Other contacts",
} as const;

export function NetworkingCard({ jobId, company, title, contacts }: NetworkingCardProps) {
  const suggestions = getNetworkingSearchSuggestions(company, title);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Networking</CardTitle>
        <CardDescription>Find relevant people and track your outreach.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <section aria-label="Public search actions">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <a
                key={suggestion.contactType}
                href={getWebSearchUrl(suggestion.query)}
                target="_blank"
                rel="noreferrer"
                aria-label={`Search the web for ${searchActionLabels[suggestion.contactType].toLowerCase()}`}
                className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 focus-visible:ring-offset-2 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:focus-visible:ring-sky-400 dark:focus-visible:ring-offset-slate-950"
              >
                {searchActionLabels[suggestion.contactType]}
              </a>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-200/80 pt-5 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">Saved contacts</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{contacts.length} saved</p>
            </div>
            {contacts.length > 0 ? <ContactSheet jobId={jobId} company={company} /> : null}
          </div>

          {contacts.length > 0 ? (
            <div className="mt-3"><ContactsList jobId={jobId} company={company} contacts={contacts} /></div>
          ) : (
            <div className="mt-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">No contacts yet. Search above or add one manually.</p>
              <div className="mt-3"><ContactSheet jobId={jobId} company={company} /></div>
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
