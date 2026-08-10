import { describe, expect, it } from "vitest";

import { getFirstInvalidJobFormField } from "@/features/jobs/job-form-state";

describe("getFirstInvalidJobFormField", () => {
  it("returns the first invalid field in form order", () => {
    expect(
      getFirstInvalidJobFormField({
        description: ["Description is too long"],
        title: ["Job title is required"],
      }),
    ).toBe("title");
  });

  it("returns undefined when there are no field errors", () => {
    expect(getFirstInvalidJobFormField()).toBeUndefined();
  });
});
