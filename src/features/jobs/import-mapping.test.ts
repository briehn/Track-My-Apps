import { describe, expect, it } from "vitest";

import {
  buildJobImportColumns,
  suggestJobImportColumnMapping,
} from "@/features/jobs/import-mapping";

describe("suggestJobImportColumnMapping", () => {
  it("auto-maps common import headers", () => {
    const columns = buildJobImportColumns([
      "Company Name",
      "Position",
      "Application Status",
      "Work Mode",
      "Follow-up Date",
    ]);

    expect(suggestJobImportColumnMapping(columns)).toEqual({
      company: "col_0",
      title: "col_1",
      status: "col_2",
      remoteType: "col_3",
      followUpDate: "col_4",
    });
  });
});

