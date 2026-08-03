import type { Octokit } from "@octokit/rest";
import { describe, expect, it, vi } from "vitest";
import { routeWebhook, type WebhookHandlers } from "../src/webhooks/router.js";

function handlers(): WebhookHandlers {
  return {
    contributionPullRequest: vi.fn(async () => undefined),
    agreementPullRequestMerged: vi.fn(async () => undefined),
    signingIssue: vi.fn(async () => undefined),
  };
}

const octokit = {} as Octokit;
const repository = { name: "repo", owner: { login: "owner" } };
const installation = { id: 123 };

describe("webhook router", () => {
  it("routes opened pull requests", async () => {
    const injected = handlers();
    const handled = await routeWebhook(
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
    expect(handled).toBe("handled");
    expect(injected.contributionPullRequest).toHaveBeenCalledOnce();
  });

  it("ignores unsupported events", async () => {
    expect(await routeWebhook(octokit, "push", {}, handlers())).toBe("ignored");
  });
});
