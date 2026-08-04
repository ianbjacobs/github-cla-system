import { describe, expect, it } from "vitest";
import { statusFromEvaluation, truncateDescription } from "../lib/status.js";

describe("contributor agreement status", () => {
  it("maps authorized evaluations to success", () => {
    expect(statusFromEvaluation({ authorized: true, summary: "Agreement found." })).toEqual({
      state: "success",
      context: "Contributor Agreement",
      description: "Agreement found.",
    });
  });

  it("maps unauthorized evaluations to failure", () => {
    expect(statusFromEvaluation({ authorized: false, summary: "Agreement required." }).state).toBe(
      "failure",
    );
  });

  it("limits commit-status descriptions", () => {
    expect(truncateDescription("x".repeat(200))).toHaveLength(140);
  });
});
