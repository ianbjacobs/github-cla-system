import { describe, expect, it } from "vitest";
import { evaluateContributorAgreement, isAgreementPullRequest } from "../lib/enforcement.js";

const registry = `schemaVersion: 1
agreementVersion: "1.0"
agreements:
  - githubId: 42
    githubNodeId: U_42
    githubLogin: octocat
    agreementVersion: "1.0"
    signedAt: '2026-08-03T12:00:00Z'
    issueNumber: 7
    issueNodeId: I_7
`;

describe("contributor agreement enforcement", () => {
  it("authorizes a contributor by immutable numeric GitHub ID", () => {
    expect(evaluateContributorAgreement({ githubId: 42 }, registry)).toMatchObject({
      authorized: true,
      exempt: false,
      entry: { githubId: 42, githubLogin: "octocat" },
    });
  });

  it("rejects an unsigned contributor", () => {
    const result = evaluateContributorAgreement({ githubId: 99 }, registry);
    expect(result.authorized).toBe(false);
    expect(result.summary).toContain("GitHub user ID 99");
  });

  it("rejects a contributor who signed an older agreement version", () => {
    const upgraded = registry.replace(
      'agreementVersion: "1.0"\nagreements:',
      'agreementVersion: "2.0"\nagreements:',
    );
    expect(evaluateContributorAgreement({ githubId: 42 }, upgraded).authorized).toBe(false);
  });

  it("exempts generated Agreement PRs from the base repository before labeling", () => {
    const generated = {
      labels: [],
      headRef: "agreement/42/issue-7",
      headRepository: "owner/repo",
      baseRepository: "owner/repo",
    };
    expect(isAgreementPullRequest(generated)).toBe(true);
    expect(evaluateContributorAgreement({ githubId: 999, ...generated }, registry)).toMatchObject({
      authorized: true,
      exempt: true,
    });
  });

  it("does not exempt a fork that imitates the Agreement PR label and branch", () => {
    expect(
      isAgreementPullRequest({
        labels: ["agreement"],
        headRef: "agreement/999/issue-1",
        headRepository: "attacker/fork",
        baseRepository: "owner/repo",
      }),
    ).toBe(false);
  });
});
