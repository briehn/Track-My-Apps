import { describe, expect, it } from "vitest";

import { getNetworkingSearchSuggestions, getWebSearchUrl } from "@/features/contacts/search-suggestions";

describe("getNetworkingSearchSuggestions", () => {
  it("creates deterministic public search queries from the saved company and job title", () => {
    const suggestions = getNetworkingSearchSuggestions("Acme Labs", "Senior Software Engineer");

    expect(suggestions.map((suggestion) => suggestion.query)).toEqual([
      '"Acme Labs" recruiter Senior Software Engineer',
      '"Acme Labs" engineering manager "Senior Software Engineer"',
      '"Acme Labs" "Senior Software Engineer" LinkedIn',
      'site:linkedin.com/in "Acme Labs" "Senior Software Engineer"',
      'site:linkedin.com/in "Acme Labs" "Engineering Manager"',
    ]);
    expect(getWebSearchUrl(suggestions[0].query)).toBe("https://www.google.com/search?q=%22Acme%20Labs%22%20recruiter%20Senior%20Software%20Engineer");
  });

  it("normalizes whitespace and prevents job content from breaking query quotes", () => {
    const suggestions = getNetworkingSearchSuggestions('  Acme "Labs"  ', "  Staff   Engineer ");

    expect(suggestions[0].query).toBe('"Acme Labs" recruiter   Staff   Engineer ');
    expect(suggestions[1].query).toBe('"Acme Labs" engineering manager "Staff Engineer"');
  });
});
