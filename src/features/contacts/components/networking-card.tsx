import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactForm } from "@/features/contacts/components/contact-form";
import { ContactsList } from "@/features/contacts/components/contacts-list";
import { contactTypeRelevance, jobContactTypeLabels } from "@/features/contacts/options";
import { getNetworkingSearchSuggestions, getWebSearchUrl } from "@/features/contacts/search-suggestions";
import type { JobContact } from "@/features/contacts/queries";

type NetworkingCardProps = {
  jobId: string;
  company: string;
  title: string;
  contacts: JobContact[];
};

const suggestedContactTypes = ["RECRUITER", "HIRING_MANAGER", "ENGINEER", "CONNECTION", "LEADERSHIP"] as const;

export function NetworkingCard({ jobId, company, title, contacts }: NetworkingCardProps) {
  const suggestions = getNetworkingSearchSuggestions(company, title);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Networking</CardTitle>
        <CardDescription>Find relevant people through public search, then keep a lightweight record of your outreach.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">Suggested people to look for</h3>
          <div className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {suggestedContactTypes.map((contactType) => <div key={contactType}><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{jobContactTypeLabels[contactType]}</p><p className="text-sm text-slate-600 dark:text-slate-400">{contactTypeRelevance[contactType]}</p></div>)}
          </div>
        </section>

        <section className="border-t border-slate-200/80 pt-5 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">Search suggestions</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {suggestions.map((suggestion) => <div key={suggestion.contactType} className="rounded-xl bg-slate-100/70 p-3 dark:bg-slate-900/60"><p className="text-sm font-medium text-slate-950 dark:text-slate-100">{suggestion.label}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{suggestion.explanation}</p><a href={getWebSearchUrl(suggestion.query)} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-md px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-200/80 dark:text-slate-200 dark:hover:bg-slate-800">Search web <span className="sr-only">for {suggestion.query}</span></a></div>)}
          </div>
        </section>

        <section className="border-t border-slate-200/80 pt-5 dark:border-slate-800">
          <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">Saved contacts</h3><p className="text-sm text-slate-600 dark:text-slate-400">{contacts.length} saved</p></div>
          {contacts.length > 0 ? <div className="mt-4"><ContactsList jobId={jobId} company={company} contacts={contacts} /></div> : <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">No saved contacts yet. Add people manually after a public search or personal introduction.</p>}
          <details className="mt-5 rounded-xl bg-slate-100/70 p-4 dark:bg-slate-900/60"><summary className="cursor-pointer text-sm font-medium text-slate-950 dark:text-slate-100">Add contact</summary><div className="mt-4"><ContactForm jobId={jobId} defaultCompany={company} /></div></details>
        </section>
      </CardContent>
    </Card>
  );
}
