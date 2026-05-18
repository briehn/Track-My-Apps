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
      status: null,
      remoteType: null,
      employmentType: null,
      sort: "newest",
    });
  });

  it("normalizes active filters and trims search text", () => {
    const result = normalizeJobsSearchParams({
      status: "APPLIED",
      q: "  stripe  ",
      remoteType: "REMOTE",
      employmentType: "FULL_TIME",
      sort: "deadlineSoonest",
    });

    expect(result).toEqual({
      view: "active",
      q: "stripe",
      status: "APPLIED",
      remoteType: "REMOTE",
      employmentType: "FULL_TIME",
      sort: "deadlineSoonest",
    });
  });

  it("ignores invalid values", () => {
    const result = normalizeJobsSearchParams({
      status: "INVALID",
      q: ["first", "second"],
      remoteType: "REMOTE_INVALID",
      employmentType: "FULL_TIME_INVALID",
      sort: "invalidSort",
    });

    expect(result).toEqual({
      view: "active",
      q: "first",
      status: null,
      remoteType: null,
      employmentType: null,
      sort: "newest",
    });
  });
});

describe("buildJobsQueryString", () => {
  it("builds active-view query strings with stable params", () => {
    const query = buildJobsQueryString({
      view: "active",
      q: "stripe",
      status: "SAVED",
      remoteType: "HYBRID",
      employmentType: "FULL_TIME",
      sort: "followUpSoonest",
    });

    expect(query).toBe(
      "?status=SAVED&q=stripe&remoteType=HYBRID&employmentType=FULL_TIME&sort=followUpSoonest",
    );
  });

  it("builds archived-view query strings without incompatible status filters", () => {
    const query = buildJobsQueryString({
      view: "archived",
      q: "",
      status: "ARCHIVED",
      remoteType: null,
      employmentType: null,
      sort: "newest",
    });

    expect(query).toBe("?status=archived");
  });
});
