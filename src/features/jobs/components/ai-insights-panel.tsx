"use client";

import { useState, type ReactNode } from "react";

type AIInsightsPanelProps = {
  analysisContent: ReactNode;
  matchContent: ReactNode;
};

type AIInsightsTab = "analysis" | "match";

export function AIInsightsPanel({
  analysisContent,
  matchContent,
}: AIInsightsPanelProps) {
  const [activeTab, setActiveTab] = useState<AIInsightsTab>("analysis");

  return (
    <div className="space-y-4">
      <div
        className="inline-flex w-full rounded-md border border-slate-200 bg-slate-50 p-1 sm:w-auto"
        role="tablist"
        aria-label="AI insights views"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "analysis"}
          className={[
            "rounded-md px-3 py-2 text-sm font-medium transition",
            activeTab === "analysis"
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-600 hover:text-slate-950",
          ].join(" ")}
          onClick={() => setActiveTab("analysis")}
        >
          Job analysis
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "match"}
          className={[
            "rounded-md px-3 py-2 text-sm font-medium transition",
            activeTab === "match"
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-600 hover:text-slate-950",
          ].join(" ")}
          onClick={() => setActiveTab("match")}
        >
          Profile match
        </button>
      </div>

      <div className="min-h-40">
        {activeTab === "analysis" ? analysisContent : matchContent}
      </div>
    </div>
  );
}
