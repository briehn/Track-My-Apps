"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/features/auth/require-user";
import {
  parseJobImportCsvFile,
  parseJobImportCsvText,
} from "@/features/jobs/import-csv";
import {
  JOB_IMPORT_MAX_FILE_BYTES,
  parseJobImportColumnMappingFromFormData,
  suggestJobImportColumnMapping,
  type JobImportColumn,
  type JobImportColumnMapping,
} from "@/features/jobs/import-mapping";
import {
  validateJobImportPreview,
  type JobImportPreviewResult,
} from "@/features/jobs/import-validation";
import { prisma } from "@/server/db/prisma";

export type PreviewJobImportActionState = {
  columns?: JobImportColumn[];
  csvText?: string;
  formError?: string;
  mapping?: JobImportColumnMapping;
  preview?: JobImportPreviewResult;
};

export type ConfirmJobImportActionState = {
  formError?: string;
  importedRowCount?: number;
  skippedDuplicateCount?: number;
  skippedInvalidRowCount?: number;
  successMessage?: string;
};

function getCsvTextByteLength(csvText: string) {
  return new TextEncoder().encode(csvText).length;
}

async function getExistingJobsForDuplicateDetection(userId: string) {
  return prisma.job.findMany({
    where: {
      userId,
    },
    select: {
      company: true,
      title: true,
      url: true,
    },
  });
}

export async function previewJobImport(
  _previousState: PreviewJobImportActionState,
  formData: FormData,
): Promise<PreviewJobImportActionState> {
  const user = await requireUser();
  const uploadedFile = formData.get("file");
  const csvText = formData.get("csvText");

  try {
    const parsedCsv =
      uploadedFile instanceof File && uploadedFile.size > 0
        ? await parseJobImportCsvFile(uploadedFile)
        : typeof csvText === "string" && csvText.length > 0
          ? parseJobImportCsvText(csvText)
          : null;

    if (!parsedCsv) {
      return {
        formError: "Choose a CSV file to preview.",
      };
    }

    if (getCsvTextByteLength(parsedCsv.csvText) > JOB_IMPORT_MAX_FILE_BYTES) {
      return {
        formError: "CSV files must be 2 MB or smaller.",
      };
    }

    if (parsedCsv.rows.length === 0) {
      return {
        formError: "The CSV file must include at least one data row.",
      };
    }

    const suggestedMapping = suggestJobImportColumnMapping(parsedCsv.columns);
    const submittedMapping = parseJobImportColumnMappingFromFormData(formData);
    const mapping =
      Object.keys(submittedMapping).length > 0 ? submittedMapping : suggestedMapping;
    const existingJobs = await getExistingJobsForDuplicateDetection(user.id);
    const previewResult = validateJobImportPreview({
      existingJobs,
      mapping,
      rows: parsedCsv.rows,
      columns: parsedCsv.columns,
    });

    if (!previewResult.preview) {
      return {
        columns: parsedCsv.columns,
        csvText: parsedCsv.csvText,
        formError: previewResult.formErrors[0],
        mapping,
      };
    }

    return {
      columns: parsedCsv.columns,
      csvText: parsedCsv.csvText,
      mapping,
      preview: previewResult.preview,
    };
  } catch (error) {
    return {
      formError:
        error instanceof Error
          ? error.message
          : "The CSV file could not be parsed.",
    };
  }
}

export async function confirmJobImport(
  _previousState: ConfirmJobImportActionState,
  formData: FormData,
): Promise<ConfirmJobImportActionState> {
  const user = await requireUser();
  const csvText = formData.get("csvText");

  if (typeof csvText !== "string" || csvText.length === 0) {
    return {
      formError: "Preview the CSV before importing.",
    };
  }

  try {
    const parsedCsv = parseJobImportCsvText(csvText);
    const mapping = parseJobImportColumnMappingFromFormData(formData);
    const existingJobs = await getExistingJobsForDuplicateDetection(user.id);
    const previewResult = validateJobImportPreview({
      existingJobs,
      mapping,
      rows: parsedCsv.rows,
      columns: parsedCsv.columns,
    });

    if (!previewResult.preview) {
      return {
        formError: previewResult.formErrors[0] ?? "The import preview is no longer valid.",
      };
    }

    if (previewResult.importableJobs.length === 0) {
      return {
        formError: "There are no valid, non-duplicate rows ready to import.",
      };
    }

    await prisma.job.createMany({
      data: previewResult.importableJobs.map((job) => ({
        ...job,
        userId: user.id,
      })),
    });

    revalidatePath("/jobs");

    return {
      importedRowCount: previewResult.preview.validRowCount,
      skippedDuplicateCount: previewResult.preview.likelyDuplicateCount,
      skippedInvalidRowCount: previewResult.preview.invalidRowCount,
      successMessage: `Imported ${previewResult.preview.validRowCount} jobs.`,
    };
  } catch (error) {
    return {
      formError:
        error instanceof Error
          ? error.message
          : "The CSV import could not be completed.",
    };
  }
}
