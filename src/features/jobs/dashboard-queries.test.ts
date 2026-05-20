import { describe, expect, it } from "vitest";

import { buildTodayFocusSummary } from "@/features/jobs/dashboard-focus";

describe("buildTodayFocusSummary", () => {
  it("sorts follow-ups by urgency and includes overdue/today only", () => {
    const now = new Date("2026-05-20T12:00:00.000Z");
    const summary = buildTodayFocusSummary(
      [
        {
          id: "overdue",
          company: "A",
          title: "Overdue follow-up",
          status: "APPLIED",
          createdAt: new Date("2026-05-10T10:00:00.000Z"),
          deadline: null,
          followUpAt: new Date("2026-05-18T10:00:00.000Z"),
          hasAnalysis: true,
        },
        {
          id: "today",
          company: "B",
          title: "Today follow-up",
          status: "SAVED",
          createdAt: new Date("2026-05-11T10:00:00.000Z"),
          deadline: null,
          followUpAt: new Date("2026-05-20T16:00:00.000Z"),
          hasAnalysis: false,
        },
        {
          id: "future",
          company: "C",
          title: "Future follow-up",
          status: "SAVED",
          createdAt: new Date("2026-05-12T10:00:00.000Z"),
          deadline: null,
          followUpAt: new Date("2026-05-22T10:00:00.000Z"),
          hasAnalysis: false,
        },
      ],
      now,
    );

    expect(summary.followUpsDue.count).toBe(2);
    expect(summary.followUpsDue.jobs.map((job) => job.id)).toEqual(["overdue", "today"]);
  });

  it("sorts upcoming deadlines and limits displayed items to three", () => {
    const now = new Date("2026-05-20T12:00:00.000Z");
    const summary = buildTodayFocusSummary(
      [
        {
          id: "d3",
          company: "A",
          title: "D3",
          status: "APPLIED",
          createdAt: new Date("2026-05-10T10:00:00.000Z"),
          deadline: new Date("2026-05-23T12:00:00.000Z"),
          followUpAt: null,
          hasAnalysis: true,
        },
        {
          id: "d1",
          company: "B",
          title: "D1",
          status: "SAVED",
          createdAt: new Date("2026-05-11T10:00:00.000Z"),
          deadline: new Date("2026-05-20T12:00:00.000Z"),
          followUpAt: null,
          hasAnalysis: false,
        },
        {
          id: "d4",
          company: "C",
          title: "D4",
          status: "SAVED",
          createdAt: new Date("2026-05-12T10:00:00.000Z"),
          deadline: new Date("2026-05-24T12:00:00.000Z"),
          followUpAt: null,
          hasAnalysis: false,
        },
        {
          id: "d2",
          company: "D",
          title: "D2",
          status: "SAVED",
          createdAt: new Date("2026-05-13T10:00:00.000Z"),
          deadline: new Date("2026-05-21T12:00:00.000Z"),
          followUpAt: null,
          hasAnalysis: false,
        },
      ],
      now,
    );

    expect(summary.upcomingDeadlines.count).toBe(4);
    expect(summary.upcomingDeadlines.jobs.map((job) => job.id)).toEqual(["d1", "d2", "d3"]);
  });

  it("returns missing analysis by most recently saved first and interview prep only for interviewing/offer", () => {
    const now = new Date("2026-05-20T12:00:00.000Z");
    const summary = buildTodayFocusSummary(
      [
        {
          id: "recent-missing",
          company: "A",
          title: "Recent Missing",
          status: "SAVED",
          createdAt: new Date("2026-05-19T10:00:00.000Z"),
          deadline: null,
          followUpAt: null,
          hasAnalysis: false,
        },
        {
          id: "older-missing",
          company: "B",
          title: "Older Missing",
          status: "APPLIED",
          createdAt: new Date("2026-05-12T10:00:00.000Z"),
          deadline: null,
          followUpAt: null,
          hasAnalysis: false,
        },
        {
          id: "has-analysis",
          company: "C",
          title: "Has Analysis",
          status: "APPLIED",
          createdAt: new Date("2026-05-18T10:00:00.000Z"),
          deadline: null,
          followUpAt: null,
          hasAnalysis: true,
        },
        {
          id: "interviewing",
          company: "D",
          title: "Interviewing",
          status: "INTERVIEWING",
          createdAt: new Date("2026-05-15T10:00:00.000Z"),
          deadline: null,
          followUpAt: null,
          hasAnalysis: true,
        },
        {
          id: "offer",
          company: "E",
          title: "Offer",
          status: "OFFER",
          createdAt: new Date("2026-05-14T10:00:00.000Z"),
          deadline: null,
          followUpAt: null,
          hasAnalysis: true,
        },
      ],
      now,
    );

    expect(summary.missingAnalysis.count).toBe(2);
    expect(summary.missingAnalysis.jobs.map((job) => job.id)).toEqual([
      "recent-missing",
      "older-missing",
    ]);
    expect(summary.interviewPrepOpportunities.count).toBe(2);
    expect(summary.interviewPrepOpportunities.jobs.map((job) => job.id)).toEqual([
      "offer",
      "interviewing",
    ]);
  });
});
