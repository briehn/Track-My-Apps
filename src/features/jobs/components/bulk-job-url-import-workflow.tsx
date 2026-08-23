"use client";

import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  reviewBulkJobUrls,
  saveBulkJobUrls,
  type BulkJobUrlImportActionResult,
} from "@/features/jobs/bulk-job-url-import-actions";
import { JOB_URL_IMPORT_MAX_BATCH_SIZE } from "@/features/jobs/bulk-job-url-import";
import type { BulkJobUrlImportItem } from "@/features/jobs/bulk-job-url-import-service";
import { JobFormFields } from "@/features/jobs/components/job-form-fields";
import {
  toJobFormValues,
  type JobFormFieldErrors,
  type JobFormFieldName,
  type JobFormValues,
} from "@/features/jobs/job-form-state";
import { createJobSchema } from "@/features/jobs/schemas";

type ReviewItemState = {
  expanded: boolean;
  fieldErrors?: JobFormFieldErrors;
  item: BulkJobUrlImportItem;
  removed: boolean;
  reviewId: string;
  saveError?: string;
  saved: boolean;
  selected: boolean;
  values: JobFormValues;
};

function getSourceLabel(item: Extract<BulkJobUrlImportItem, { status: "success" }>) {
  if (item.source.kind === "GREENHOUSE") {
    return "Greenhouse";
  }

  if (item.source.kind === "LEVER") {
    return "Lever";
  }

  if (item.source.kind === "GEM") {
    return "Gem";
  }

  if (item.source.kind === "RIPPLING") {
    return "Rippling";
  }

  return "JobPosting JSON-LD";
}

function getMissingRequiredFields(values: JobFormValues) {
  const parsed = createJobSchema.safeParse(values);

  if (parsed.success) {
    return [];
  }

  return [
    ...(parsed.error.flatten().fieldErrors.company ? ["company"] : []),
    ...(parsed.error.flatten().fieldErrors.title ? ["title"] : []),
  ];
}

function toReviewItems(result: Extract<BulkJobUrlImportActionResult, { success: true }>) {
  return result.items.map((item) => {
    const values = item.status === "success" ? toJobFormValues(item.seed) : {};
    const isReady = item.status === "success" && createJobSchema.safeParse(values).success;
    const hasDuplicate =
      item.status === "success" && Boolean(item.duplicate || item.batchDuplicateOfLineNumber);

    return {
      expanded: false,
      item,
      removed: false,
      reviewId: `line-${item.lineNumber}`,
      saved: false,
      selected: isReady && !hasDuplicate,
      values,
    } satisfies ReviewItemState;
  });
}

function ReviewItem({
  reviewItem,
  onChange,
  onRemove,
  onToggleSelection,
  onToggleExpanded,
}: {
  reviewItem: ReviewItemState;
  onChange: (fieldName: JobFormFieldName, value: string) => void;
  onRemove: () => void;
  onToggleExpanded: () => void;
  onToggleSelection: (selected: boolean) => void;
}) {
  const { item, values } = reviewItem;

  if (item.status === "failure") {
    return (
      <article className="rounded-md border border-red-200 bg-red-50 p-4" aria-label={`Import failed for line ${item.lineNumber}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-red-800">Couldn&apos;t import URL on line {item.lineNumber}</p>
            <p className="mt-1 break-all text-sm text-red-700">{item.submittedUrl}</p>
            <p className="mt-2 text-sm text-red-700">{item.message}</p>
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
            Remove
          </Button>
        </div>
      </article>
    );
  }

  const missingRequiredFields = getMissingRequiredFields(values);
  const isReady = missingRequiredFields.length === 0;
  const title = values.title?.trim() || "Untitled job";
  const company = values.company?.trim() || "Company required";

  return (
    <article className="rounded-md border border-slate-200 bg-white p-4" aria-label={`${title} import review`}>
      <div className="flex items-start gap-3">
        <input
          aria-label={`Select ${title} at ${company}`}
          checked={reviewItem.selected}
          className="mt-1 size-4 accent-slate-950"
          disabled={!isReady || reviewItem.saved}
          onChange={(event) => onToggleSelection(event.currentTarget.checked)}
          type="checkbox"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-medium text-slate-950">{title} <span className="font-normal text-slate-500">— {company}</span></p>
              <p className="mt-1 text-sm text-slate-600">
                {getSourceLabel(item)}
                {values.location ? ` · ${values.location}` : ""}
                {values.remoteType ? ` · ${values.remoteType.toLocaleLowerCase()}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button type="button" size="sm" variant="ghost" onClick={onToggleExpanded}>
                {reviewItem.expanded ? "Close" : "Edit"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
                Remove
              </Button>
            </div>
          </div>

          {item.warnings.map((warning) => (
            <p key={warning.code} className="mt-2 text-sm text-amber-800">{warning.message}</p>
          ))}
          {item.duplicate ? (
            <p className="mt-2 text-sm text-amber-800">This job may already be in your tracker. It is unchecked by default.</p>
          ) : null}
          {item.batchDuplicateOfLineNumber ? (
            <p className="mt-2 text-sm text-amber-800">This matches the imported job on line {item.batchDuplicateOfLineNumber}. It is unchecked by default.</p>
          ) : null}
          {!isReady ? (
            <p className="mt-2 text-sm text-amber-800">
              {missingRequiredFields.length > 0
                ? `Add a valid ${missingRequiredFields.join(" and ")} before this job can be selected.`
                : "Correct the invalid details before this job can be selected."}
            </p>
          ) : null}
          {reviewItem.saved ? <p className="mt-2 text-sm text-emerald-700">Added to your tracker.</p> : null}
          {reviewItem.saveError ? <p className="mt-2 text-sm text-red-700">{reviewItem.saveError}</p> : null}

          {reviewItem.expanded ? (
            <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
              <JobFormFields
                errors={reviewItem.fieldErrors}
                idPrefix={`${reviewItem.reviewId}-`}
                onValueChange={onChange}
                values={values}
              />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function BulkJobUrlImportWorkflow() {
  const [submittedText, setSubmittedText] = useState("");
  const [formError, setFormError] = useState<string>();
  const [ignoredBlankLineCount, setIgnoredBlankLineCount] = useState(0);
  const [reviewItems, setReviewItems] = useState<ReviewItemState[]>([]);
  const [isReviewing, startReviewTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();

  const visibleItems = reviewItems.filter((item) => !item.removed);
  const selectedItems = visibleItems.filter((item) => item.selected && !item.saved && item.item.status === "success");
  const eligibleItems = visibleItems.filter((reviewItem) => {
    if (reviewItem.item.status !== "success" || reviewItem.saved) return false;
    if (reviewItem.item.duplicate || reviewItem.item.batchDuplicateOfLineNumber) return false;
    return createJobSchema.safeParse(reviewItem.values).success;
  });
  const summary = useMemo(() => ({
    failed: visibleItems.filter((item) => item.item.status === "failure").length,
    ready: eligibleItems.length,
  }), [eligibleItems.length, visibleItems]);

  const reviewUrls = () => {
    setFormError(undefined);
    startReviewTransition(async () => {
      const result = await reviewBulkJobUrls(submittedText);

      if (!result.success) {
        setFormError(result.formError);
        return;
      }

      setIgnoredBlankLineCount(result.ignoredBlankLineCount);
      setReviewItems(toReviewItems(result));
    });
  };

  const updateReviewItem = (reviewId: string, update: (item: ReviewItemState) => ReviewItemState) => {
    setReviewItems((items) => items.map((item) => (item.reviewId === reviewId ? update(item) : item)));
  };

  const selectAllEligible = () => {
    setReviewItems((items) => items.map((item) => {
      const isEligible =
        item.item.status === "success" &&
        !item.saved &&
        !item.item.duplicate &&
        !item.item.batchDuplicateOfLineNumber &&
        createJobSchema.safeParse(item.values).success;
      return isEligible ? { ...item, selected: true } : item;
    }));
  };

  const saveSelected = () => {
    if (selectedItems.length === 0) {
      setFormError("Select at least one complete job to add.");
      return;
    }

    setFormError(undefined);
    startSaveTransition(async () => {
      const result = await saveBulkJobUrls(
        selectedItems.map((item) => ({ reviewId: item.reviewId, draft: item.values })),
      );

      if (!result.success) {
        setFormError(result.formError);
        return;
      }

      const resultsById = new Map(result.results.map((item) => [item.reviewId, item]));
      setReviewItems((items) => items.map((item) => {
        const saveResult = resultsById.get(item.reviewId);
        if (!saveResult) return item;
        if (saveResult.status === "saved") return { ...item, saved: true, selected: false };
        return {
          ...item,
          expanded: true,
          fieldErrors: saveResult.fieldErrors as JobFormFieldErrors | undefined,
          saveError: saveResult.message,
        };
      }));
    });
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-md border border-slate-200 bg-white p-5">
        <div>
          <h2 className="font-semibold text-slate-950">Import from job URLs</h2>
          <p className="mt-1 text-sm text-slate-600">Paste one URL per line. Supported sources are imported for review; nothing is added until you confirm.</p>
        </div>
        <label htmlFor="bulk-job-urls" className="text-sm font-medium text-slate-950">Job posting URLs</label>
        <textarea
          id="bulk-job-urls"
          value={submittedText}
          onChange={(event) => setSubmittedText(event.currentTarget.value)}
          placeholder={"https://jobs.lever.co/company/posting-id\nhttps://boards.greenhouse.io/company/jobs/123"}
          rows={8}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">Up to {JOB_URL_IMPORT_MAX_BATCH_SIZE} URLs at a time.</p>
          <Button type="button" onClick={reviewUrls} disabled={isReviewing || !submittedText.trim()}>
            {isReviewing ? "Reviewing imports..." : "Review imports"}
          </Button>
        </div>
        {formError ? <p role="alert" className="text-sm text-red-700">{formError}</p> : null}
      </section>

      {reviewItems.length > 0 ? (
        <section className="space-y-4" aria-live="polite">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-950">Review imports</h2>
              <p className="mt-1 text-sm text-slate-600">{summary.ready} complete {summary.ready === 1 ? "job" : "jobs"} ready to select{summary.failed ? ` · ${summary.failed} could not be imported` : ""}.</p>
              {ignoredBlankLineCount > 0 ? <p className="mt-1 text-sm text-slate-600">Ignored {ignoredBlankLineCount} blank {ignoredBlankLineCount === 1 ? "line" : "lines"}.</p> : null}
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={selectAllEligible} disabled={isSaving || eligibleItems.length === 0}>
              Select all eligible
            </Button>
          </div>

          <div className="space-y-3">
            {visibleItems.map((reviewItem) => (
              <ReviewItem
                key={reviewItem.reviewId}
                reviewItem={reviewItem}
                onChange={(fieldName, value) => updateReviewItem(reviewItem.reviewId, (item) => ({
                  ...item,
                  fieldErrors: undefined,
                  saveError: undefined,
                  values: { ...item.values, [fieldName]: value },
                }))}
                onRemove={() => updateReviewItem(reviewItem.reviewId, (item) => ({ ...item, removed: true, selected: false }))}
                onToggleExpanded={() => updateReviewItem(reviewItem.reviewId, (item) => ({ ...item, expanded: !item.expanded }))}
                onToggleSelection={(selected) => updateReviewItem(reviewItem.reviewId, (item) => ({ ...item, selected }))}
              />
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">{selectedItems.length} selected. Each selected job is validated and added independently.</p>
            <Button type="button" onClick={saveSelected} disabled={isSaving || selectedItems.length === 0}>
              {isSaving ? "Adding jobs..." : `Add selected jobs${selectedItems.length ? ` (${selectedItems.length})` : ""}`}
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
