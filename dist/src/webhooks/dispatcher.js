import {
  onAgreementPullRequestMerged,
  onContributionPullRequest,
  onDefaultBranchPush,
  onSigningIssue,
} from "../application/handlers.js";
import { GitHubGateway } from "../infrastructure/github/gateway.js";
import { parseSupportedWebhook } from "./events.js";

const defaultHandlers = {
  contributionPullRequest: onContributionPullRequest,
  agreementPullRequestMerged: onAgreementPullRequestMerged,
  signingIssue: onSigningIssue,
  defaultBranchPush: onDefaultBranchPush,
};
export async function dispatchWebhook(octokit, event, payload, handlers = defaultHandlers) {
  const parsed = parseSupportedWebhook(event, payload);
  if (!parsed)
    return event === "issues" || event === "pull_request" || event === "push"
      ? "invalid"
      : "ignored";
  const repository = parsed.payload.repository;
  const github = new GitHubGateway(octokit, {
    owner: repository.owner.login,
    repo: repository.name,
  });
  if (parsed.kind === "pull_request") {
    return dispatchPullRequest(github, parsed.payload, handlers);
  }
  if (parsed.kind === "push") {
    return dispatchPush(github, parsed.payload, handlers);
  }
  return dispatchIssue(github, parsed.payload, handlers);
}
async function dispatchPullRequest(github, payload, handlers) {
  const pullRequest = payload.pull_request;
  if (["opened", "reopened", "synchronize"].includes(payload.action)) {
    const labelNames = pullRequest.labels.flatMap((label) => {
      const name = typeof label === "string" ? label : label.name;
      return typeof name === "string" && name.length > 0 ? [name] : [];
    });
    const generatedAgreementPullRequest =
      labelNames.includes("agreement") ||
      pullRequest.body?.includes("<!-- github-cla-pr:") === true;
    if (generatedAgreementPullRequest) return "ignored";
    if (!pullRequest.user) return "invalid";
    await handlers.contributionPullRequest(github, {
      contributor: {
        id: pullRequest.user.id,
        nodeId: pullRequest.user.node_id,
        login: pullRequest.user.login,
      },
      number: pullRequest.number,
      headSha: pullRequest.head.sha,
    });
    return "handled";
  }
  await handlers.agreementPullRequestMerged(github, {
    number: pullRequest.number,
    body: pullRequest.body,
    labels: pullRequest.labels.flatMap((label) => {
      const name = typeof label === "string" ? label : label.name;
      return typeof name === "string" && name.length > 0 ? [name] : [];
    }),
    merged: pullRequest.merged === true,
  });
  return "handled";
}
async function dispatchIssue(github, payload, handlers) {
  const issue = payload.issue;
  if (payload.action !== "opened" || issue.pull_request || issue.state !== "open") return "ignored";
  if (!issue.title.startsWith("[CLA]")) return "ignored";
  if (!issue.user) return "invalid";
  await handlers.signingIssue(github, {
    issueNumber: issue.number,
    author: { id: issue.user.id, nodeId: issue.user.node_id, login: issue.user.login },
    body: issue.body ?? "",
    nodeId: issue.node_id,
    createdAt: issue.created_at,
  });
  return "handled";
}
async function dispatchPush(github, payload, handlers) {
  if (payload.ref !== `refs/heads/${payload.repository.default_branch}`) return "ignored";
  await handlers.defaultBranchPush(github);
  return "handled";
}
