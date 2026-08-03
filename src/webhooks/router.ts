import type { Octokit } from "@octokit/rest";
import {
  onAgreementPullRequestMerged,
  onContributionPullRequest,
  onSigningIssue,
} from "../application/handlers.js";
import { GitHubGateway } from "../infrastructure/github/gateway.js";

type UserPayload = { id: number; login: string };
type LabelPayload = string | { name?: string | null };
type RepositoryPayload = { name: string; owner: { login: string } };

type PullRequestPayload = {
  number: number;
  body: string | null;
  merged?: boolean;
  user: UserPayload | null;
  head: { sha: string };
  labels: LabelPayload[];
};

type IssuePayload = {
  number: number;
  node_id: string;
  body: string | null;
  state: string;
  user: UserPayload | null;
  pull_request?: unknown;
};

type WebhookPayload = {
  action?: string;
  repository?: RepositoryPayload;
  pull_request?: PullRequestPayload;
  issue?: IssuePayload;
};

export async function routeWebhook(
  octokit: Octokit,
  event: string,
  payload: unknown,
): Promise<void> {
  if (!isWebhookPayload(payload) || !payload.repository) return;

  const github = new GitHubGateway(octokit, {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
  });

  if (event === "pull_request" && payload.pull_request) {
    const pullRequest = payload.pull_request;

    if (["opened", "reopened", "synchronize"].includes(payload.action ?? "")) {
      if (!pullRequest.user) throw new Error("Pull request author missing.");

      await onContributionPullRequest(github, {
        contributor: { id: pullRequest.user.id, login: pullRequest.user.login },
        number: pullRequest.number,
        headSha: pullRequest.head.sha,
      });
    } else if (payload.action === "closed") {
      await onAgreementPullRequestMerged(github, {
        number: pullRequest.number,
        body: pullRequest.body,
        labels: pullRequest.labels.flatMap((label) => {
          const name = typeof label === "string" ? label : label.name;
          return typeof name === "string" && name.length > 0 ? [name] : [];
        }),
        merged: pullRequest.merged === true,
      });
    }

    return;
  }

  if (
    event === "issues" &&
    ["opened", "edited", "reopened"].includes(payload.action ?? "") &&
    payload.issue
  ) {
    const issue = payload.issue;
    if (issue.pull_request || issue.state !== "open" || !issue.user) return;

    await onSigningIssue(github, {
      issueNumber: issue.number,
      author: { id: issue.user.id, login: issue.user.login },
      body: issue.body ?? "",
      nodeId: issue.node_id,
    });
  }
}

function isWebhookPayload(value: unknown): value is WebhookPayload {
  return typeof value === "object" && value !== null;
}
