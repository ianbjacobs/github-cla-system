import type { Octokit } from "@octokit/rest";
import { describe, expect, it, vi } from "vitest";
import { dispatchWebhook, type WebhookHandlers } from "../src/webhooks/dispatcher.js";

const octokit = {} as Octokit;
const repository = { name: "repo", owner: { login: "owner" } };
const installation = { id: 123 };

function handlers(): WebhookHandlers {
  return {
    contributionPullRequest: vi.fn().mockResolvedValue(undefined),
    agreementPullRequestMerged: vi.fn().mockResolvedValue(undefined),
    signingIssue: vi.fn().mockResolvedValue(undefined),
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
          user: { id: 42, login: "octocat" },
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
          node_id: "I_node",
          body: "accepted",
          state: "open",
          user: { id: 42, login: "octocat" },
        },
      },
      injected,
    );

    expect(result).toBe("handled");
    expect(injected.signingIssue).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ issueNumber: 9, nodeId: "I_node" }),
    );
  });

  it("distinguishes ignored events from invalid supported payloads", async () => {
    expect(await dispatchWebhook(octokit, "ping", {}, handlers())).toBe("ignored");
    expect(await dispatchWebhook(octokit, "issues", {}, handlers())).toBe("invalid");
  });
});
