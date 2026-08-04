import { describe, expect, it, vi } from "vitest";
import { dispatchWebhook } from "../src/webhooks/dispatcher.js";

const octokit = {};
const repository = { name: "repo", owner: { login: "owner" } };
const installation = { id: 123 };
function handlers() {
  return {
    contributionPullRequest: vi.fn().mockResolvedValue(undefined),
    agreementPullRequestMerged: vi.fn().mockResolvedValue(undefined),
    signingIssue: vi.fn().mockResolvedValue(undefined),
    defaultBranchPush: vi.fn().mockResolvedValue(undefined),
  };
}
describe("webhook dispatcher", () => {
  it("routes a contribution pull request", async () => {
    const injected = handlers();
    const result = await dispatchWebhook(
      octokit,
      "pull_request",
      {
        action: "opened",
        installation,
        repository,
        pull_request: {
          number: 7,
          body: null,
          user: { id: 42, login: "octocat", node_id: "U_42" },
          head: { sha: "abc123" },
          labels: [],
        },
      },
      injected,
    );
    expect(result).toBe("handled");
    expect(injected.contributionPullRequest).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ number: 7, headSha: "abc123" }),
    );
  });
  it("ignores generated agreement pull requests", async () => {
    const injected = handlers();
    const result = await dispatchWebhook(
      octokit,
      "pull_request",
      {
        action: "opened",
        installation,
        repository,
        pull_request: {
          number: 8,
          body: null,
          user: { id: 42, login: "octocat", node_id: "U_42" },
          head: { sha: "agreement123" },
          labels: [{ name: "agreement" }],
        },
      },
      injected,
    );
    expect(result).toBe("ignored");
    expect(injected.contributionPullRequest).not.toHaveBeenCalled();
  });
  it("ignores generated agreement pull requests identified by metadata", async () => {
    const injected = handlers();
    const result = await dispatchWebhook(
      octokit,
      "pull_request",
      {
        action: "synchronize",
        installation,
        repository,
        pull_request: {
          number: 8,
          body: "<!-- github-cla-pr:eyJnaXRodWJJZCI6NDJ9 -->",
          user: { id: 42, login: "octocat", node_id: "U_42" },
          head: { sha: "agreement456" },
          labels: [],
        },
      },
      injected,
    );
    expect(result).toBe("ignored");
    expect(injected.contributionPullRequest).not.toHaveBeenCalled();
  });
  it("re-evaluates pull requests after a default-branch push", async () => {
    const injected = handlers();
    const result = await dispatchWebhook(
      octokit,
      "push",
      {
        installation,
        repository: { ...repository, default_branch: "main" },
        ref: "refs/heads/main",
      },
      injected,
    );
    expect(result).toBe("handled");
    expect(injected.defaultBranchPush).toHaveBeenCalledOnce();
  });
  it("ignores pushes to non-default branches", async () => {
    const injected = handlers();
    const result = await dispatchWebhook(
      octokit,
      "push",
      {
        installation,
        repository: { ...repository, default_branch: "main" },
        ref: "refs/heads/feature",
      },
      injected,
    );
    expect(result).toBe("ignored");
    expect(injected.defaultBranchPush).not.toHaveBeenCalled();
  });
  it("routes an open signing issue and retains the issue node id", async () => {
    const injected = handlers();
    const result = await dispatchWebhook(
      octokit,
      "issues",
      {
        action: "opened",
        installation,
        repository,
        issue: {
          number: 9,
          title: "[CLA] Contributor agreement",
          node_id: "I_node",
          body: "accepted",
          state: "open",
          created_at: "2026-08-03T12:00:00.000Z",
          user: { id: 42, login: "octocat", node_id: "U_42" },
        },
      },
      injected,
    );
    expect(result).toBe("handled");
    expect(injected.signingIssue).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        issueNumber: 9,
        nodeId: "I_node",
        createdAt: "2026-08-03T12:00:00.000Z",
        author: expect.objectContaining({ nodeId: "U_42" }),
      }),
    );
  });
  it("distinguishes ignored events from invalid supported payloads", async () => {
    expect(await dispatchWebhook(octokit, "ping", {}, handlers())).toBe("ignored");
    expect(await dispatchWebhook(octokit, "issues", {}, handlers())).toBe("invalid");
  });
});
