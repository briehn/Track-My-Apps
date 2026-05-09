import { describe, expect, it } from "vitest";

import {
  buildJobImportColumns,
  type JobImportColumnMapping,
} from "@/features/jobs/import-mapping";
import { validateJobImportPreview } from "@/features/jobs/import-validation";

describe("validateJobImportPreview", () => {
  it("classifies valid, invalid, and duplicate rows", () => {
    const columns = buildJobImportColumns([
      "company",
      "title",
      "status",
      "url",
      "deadline",
    ]);
    const mapping: JobImportColumnMapping = {
      company: "col_0",
      title: "col_1",
      status: "col_2",
      url: "col_3",
      deadline: "col_4",
    };

    const result = validateJobImportPreview({
      columns,
      existingJobs: [
        {
          company: "Acme",
          title: "Frontend Engineer",
          url: "https://example.com/jobs/1",
        },
      ],
      mapping,
      rows: [
        {
          col_0: "Beta Corp",
          col_1: "Product Manager",
          col_2: "Applied",
          col_3: "https://example.com/jobs/2",
          col_4: "2026-06-01",
        },
        {
          col_0: "Acme",
          col_1: "Frontend Engineer",
          col_2: "Saved",
          col_3: "https://example.com/jobs/1",
          col_4: "2026-06-01",
        },
        {
          col_0: "Gamma",
          col_1: "Designer",
          col_2: "Unknown",
          col_3: "javascript:alert(1)",
          col_4: "13/42/2026",
        },
      ],
    });

    expect(result.formErrors).toEqual([]);
    expect(result.preview).not.toBeNull();
    expect(result.preview?.validRowCount).toBe(1);
    expect(result.preview?.likelyDuplicateCount).toBe(1);
    expect(result.preview?.invalidRowCount).toBe(1);
    expect(result.importableJobs).toHaveLength(1);
    expect(result.preview?.rows[1].outcome).toBe("duplicate");
    expect(result.preview?.rows[2].outcome).toBe("invalid");
  });

  it("requires required mappings before previewing", () => {
    const columns = buildJobImportColumns(["company", "title"]);

    const result = validateJobImportPreview({
      columns,
      existingJobs: [],
      mapping: {
        company: "col_0",
      },
      rows: [
        {
          col_0: "Acme",
          col_1: "Engineer",
        },
      ],
    });

    expect(result.preview).toBeNull();
    expect(result.formErrors[0]).toBe("Job title must be mapped before previewing the import.");
  });
});

