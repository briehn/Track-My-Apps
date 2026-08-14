"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type JobDescriptionProps = {
  description: string;
  jobId: string;
};

export function JobDescription({ description, jobId }: JobDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentId = `job-description-${jobId}`;

  return (
    <div className="space-y-2">
      <div
        id={contentId}
        className={[
          "whitespace-pre-wrap bg-slate-50/70 px-3 py-2.5 text-sm leading-7 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
          isExpanded ? "" : "max-h-64 overflow-auto",
        ].join(" ")}
      >
        {description}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        aria-controls={contentId}
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((previous) => !previous)}
      >
        {isExpanded ? "Collapse description" : "Expand description"}
      </Button>
    </div>
  );
}
