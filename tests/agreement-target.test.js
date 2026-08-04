import { describe, expect, it } from "vitest";
import { agreementIssueTitle, agreementTargetBranch } from "../lib/agreement-target.js";

describe("agreement target branch", () => {
  it("round-trips a PR base branch through the signing issue title", () => {
    const title = agreementIssueTitle("test-clean");
    expect(title).toBe("[Agreement] Acceptance for branch: test-clean");
    expect(agreementTargetBranch(title, "main")).toBe("test-clean");
  });

  it("falls back to the default branch for a manually opened issue", () => {
    expect(agreementTargetBranch("[Agreement] Acceptance", "main")).toBe("main");
  });

  it("supports slash-delimited branch names", () => {
    const title = agreementIssueTitle("release/next");
    expect(agreementTargetBranch(title, "main")).toBe("release/next");
  });
});
