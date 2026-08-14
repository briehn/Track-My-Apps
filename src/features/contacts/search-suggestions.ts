import type { JobContactType } from "@/features/contacts/options";

export type NetworkingSearchSuggestion = {
  contactType: JobContactType;
  label: string;
  query: string;
  explanation: string;
};

function quotedSearchTerm(value: string) {
  return `"${value.replace(/\s+/g, " ").trim().replaceAll('"', "")}"`;
}

export function getNetworkingSearchSuggestions(
  company: string,
  title: string,
): NetworkingSearchSuggestion[] {
  const companyTerm = quotedSearchTerm(company);
  const titleTerm = quotedSearchTerm(title);

  return [
    {
      contactType: "RECRUITER",
      label: "Search recruiters",
      query: `${companyTerm} recruiter ${title}`,
      explanation: "Recruiters may help route your application.",
    },
    {
      contactType: "HIRING_MANAGER",
      label: "Search engineering managers",
      query: `${companyTerm} engineering manager ${titleTerm}`,
      explanation: "A likely manager may understand the team's hiring needs.",
    },
    {
      contactType: "ENGINEER",
      label: "Search engineers",
      query: `${companyTerm} ${titleTerm} LinkedIn`,
      explanation: "Engineers can provide team context or referrals.",
    },
    {
      contactType: "CONNECTION",
      label: "Search connections",
      query: `site:linkedin.com/in ${companyTerm} ${titleTerm}`,
      explanation: "Look for alumni or existing connections with relevant context.",
    },
    {
      contactType: "LEADERSHIP",
      label: "Search leaders",
      query: `site:linkedin.com/in ${companyTerm} "Engineering Manager"`,
      explanation: "For smaller companies, a leader may have direct role context.",
    },
  ];
}

export function getWebSearchUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}
