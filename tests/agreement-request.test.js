import { describe, expect, it } from "vitest";
import { prepareAgreementRequest } from "../lib/agreement-request.js";
import { parseRegistry } from "../lib/registry.js";

const body = `- [x] I have read and agree to the Contributor Agreement.\n- [x] I am submitting this agreement for my own authenticated GitHub account.`;

function event(overrides = {}) {
  return {
    action: "opened",
    issue: {
      number: 42,
      node_id: "I_issue",
      created_at: "2026-08-04T02:00:00Z",
      body,
      labels: [{ name: "pending-agreement" }],
      user: { id: 123, node_id: "U_user", login: "octocat" },
      ...overrides,
    },
  };
}

const emptyRegistry = `schemaVersion: 1\nagreementVersion: "1.0"\nagreements: []\n`;

describe("agreement request preparation", () => {
  it("prepares a branch-only registry update and PR metadata", () => {
    const result = prepareAgreementRequest(event(), emptyRegistry);
    expect(result.status).toBe("prepared");
    if (result.status !== "prepared") throw new Error("Expected prepared result.");
    expect(result.branch).toBe("agreement/123/issue-42");
    expect(result.pullRequestBody).toContain("Closes #42");
    const registry = parseRegistry(result.registry);
    expect(registry.agreements[0]).toMatchObject({
      githubId: 123,
      githubNodeId: "U_user",
      issueNodeId: "I_issue",
      agreementVersion: "1.0",
    });
  });

  it("rejects a signing issue with missing acknowledgement", () => {
    const result = prepareAgreementRequest(event({ body: "- [ ] Not accepted" }), emptyRegistry);
    expect(result.status).toBe("invalid");
  });

  it("ignores issues without the signing template label", () => {
    const result = prepareAgreementRequest(event({ labels: [] }), emptyRegistry);
    expect(result).toMatchObject({ status: "ignored" });
  });

  it("does not create another entry for a current signer", () => {
    const first = prepareAgreementRequest(event(), emptyRegistry);
    if (first.status !== "prepared") throw new Error("Expected prepared result.");
    const result = prepareAgreementRequest(
      event({ number: 43, node_id: "I_second" }),
      first.registry,
    );
    expect(result).toMatchObject({ status: "already-signed", issueNumber: 43 });
  });
});
