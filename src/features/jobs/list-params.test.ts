import { describe, expect, it } from "vitest";

import {
  buildJobsQueryString,
  normalizeJobsSearchParams,
} from "@/features/jobs/list-params";

describe("normalizeJobsSearchParams", () => {
  it("normalizes archived view and defaults", () => {
    const result = normalizeJobsSearchParams({
      status: "archived",
    });

    expect(result).toEqual({
      view: "archived",
      q: "",
      statuses: [],
      remoteTypes: [],
      employmentTypes: [],
      sort: "newest",
    });
  });

  it("normalizes active multi-value filters and trims search text", () => {
    const result = normalizeJobsSearchParams({
      statuses: "APPLIED,OFFER",
      q: "  stripe  ",
      remoteTypes: "REMOTE,HYBRID",
      employmentTypes: "FULL_TIME,CONTRACT",
      sort: "deadlineSoonest",
    });

    expect(result).toEqual({
      view: "active",
      q: "stripe",
      statuses: ["APPLIED", "OFFER"],
      remoteTypes: ["REMOTE", "HYBRID"],
      employmentTypes: ["FULL_TIME", "CONTRACT"],
      sort: "deadlineSoonest",
    });
  });

  it("supports legacy single-value params for backward compatibility", () => {
    const result = normalizeJobsSearchParams({
      status: "APPLIED",
      remoteType: "REMOTE",
      employmentType: "FULL_TIME",
    });

    expect(result).toEqual({
      view: "active",
      q: "",
      statuses: ["APPLIED"],
      remoteTypes: ["REMOTE"],
      employmentTypes: ["FULL_TIME"],
      sort: "newest",
    });
  });

  it("ignores invalid values", () => {
    const result = normalizeJobsSearchParams({
      status: "INVALID",
      q: ["first", "second"],
      statuses: "INVALID,SAVED",
      remoteTypes: "REMOTE_INVALID",
      employmentTypes: "FULL_TIME_INVALID",
      sort: "invalidSort",
    });

    expect(result).toEqual({
      view: "active",
      q: "first",
      statuses: ["SAVED"],
      remoteTypes: [],
      employmentTypes: [],
      sort: "newest",
    });
  });
});

describe("buildJobsQueryString", () => {
  it("builds active-view query strings with stable params", () => {
    const query = buildJobsQueryString({
      view: "active",
      q: "stripe",
      statuses: ["SAVED", "APPLIED"],
      remoteTypes: ["HYBRID"],
      employmentTypes: ["FULL_TIME"],
      sort: "followUpSoonest",
    });

    expect(query).toBe(
      "?statuses=SAVED%2CAPPLIED&q=stripe&remoteTypes=HYBRID&employmentTypes=FULL_TIME&sort=followUpSoonest",
    );
  });

  it("builds archived-view query strings without incompatible status filters", () => {
    const query = buildJobsQueryString({
      view: "archived",
      q: "",
      statuses: ["ARCHIVED"],
      remoteTypes: [],
      employmentTypes: [],
      sort: "newest",
    });

    expect(query).toBe("?status=archived");
  });
});
