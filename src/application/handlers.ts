import { CONFIG_PATH, parseRepositoryConfig } from "../config/repositoryConfig.js";
import type { ClaConfig, Contributor } from "../domain/types.js";
import { normalizeLogin } from "../domain/validation.js";
import type { GitHubGateway } from "../infrastructure/github/gateway.js";
import { acceptanceComplete, contributionPrNumber } from "./issueForm.js";
import { addAgreement, findAgreement, parseRegistry, serializeRegistry } from "./registry.js";

async function config(github: GitHubGateway): Promise<ClaConfig> {
  return parseRepositoryConfig(await github.readText(CONFIG_PATH));
}

export async function onContributionPullRequest(
  github: GitHubGateway,
  input: { contributor: Contributor; number: number; headSha: string },
): Promise<void> {
  const cfg = await config(github);
  const registry = parseRegistry(await github.readText(cfg.agreementRegistryPath));
  const entry = findAgreement(
    registry,
    input.contributor.id,
    cfg.agreementVersion,
    github.fullName(),
  );
  if (entry) {
    await github.setCheck(
      input.headSha,
      cfg.statusCheckName,
      "success",
      `Merged CLA ${entry.agreementVersion} found for GitHub user ID ${entry.githubId}.`,
    );
    return;
  }
  await github.setCheck(
    input.headSha,
    cfg.statusCheckName,
    "pending",
    `No merged CLA ${cfg.agreementVersion} exists for GitHub user ID ${input.contributor.id}.`,
  );
  const agreement = await github.readText(cfg.agreementTemplatePath);
  if (!agreement) throw new Error(`Agreement template ${cfg.agreementTemplatePath} is missing.`);
  await github.createOrReuseSigningIssue({
    login: normalizeLogin(input.contributor.login),
    githubId: input.contributor.id,
    prNumber: input.number,
    version: cfg.agreementVersion,
    agreement,
    agreementLabel: cfg.labels.agreement,
    pendingLabel: cfg.labels.pending,
  });
}

export async function onSigningIssue(
  github: GitHubGateway,
  input: { issueNumber: number; author: Contributor; body: string; nodeId: string },
): Promise<void> {
  if (!acceptanceComplete(input.body)) return;
  const cfg = await config(github);
  const prNumber = contributionPrNumber(input.body) ?? extractMarkerPr(input.body);
  if (!prNumber)
    throw new Error("The signing issue does not identify a contribution pull request.");
  const pr = await github.getPull(prNumber);
  if (
    !pr.user ||
    pr.user.id !== input.author.id ||
    pr.user.login.toLowerCase() !== input.author.login.toLowerCase()
  )
    throw new Error("The contribution PR author does not match the signing issue author.");
  const registry = parseRegistry(await github.readText(cfg.agreementRegistryPath));
  if (findAgreement(registry, input.author.id, cfg.agreementVersion, github.fullName())) {
    await github.comment(
      input.issueNumber,
      "✅ Your CLA is already recorded in the merged registry.",
    );
    await github.closeIssue(input.issueNumber, [cfg.labels.agreement]);
    await github.setCheck(
      pr.head.sha,
      cfg.statusCheckName,
      "success",
      "Contributor has a merged CLA record.",
    );
    return;
  }
  const entry = {
    githubId: input.author.id,
    githubLogin: normalizeLogin(input.author.login),
    agreementVersion: cfg.agreementVersion,
    signedAt: new Date().toISOString(),
    repository: github.fullName(),
    issueNumber: input.issueNumber,
    issueNodeId: input.nodeId,
    contributionPullRequestNumber: prNumber,
  };
  const updated = addAgreement(registry, entry);
  const branch = `cla/${input.author.id}/${input.issueNumber}/${cfg.agreementVersion.replace(/[^a-z0-9._-]+/gi, "-")}`;
  const agreementPr = await github.createAgreementPr({
    branch,
    base: await github.defaultBranch(),
    registryPath: cfg.agreementRegistryPath,
    registryContent: serializeRegistry(updated),
    entry,
    label: cfg.labels.agreement,
  });
  await github.comment(
    input.issueNumber,
    `✅ Agreement PR opened: ${agreementPr.url}\n\nA maintainer must merge it before the contribution check passes.`,
  );
  await github.closeIssue(input.issueNumber, [cfg.labels.agreement]);
  await github.setCheck(
    pr.head.sha,
    cfg.statusCheckName,
    "pending",
    `Agreement PR #${agreementPr.number} awaits maintainer review.`,
  );
}

export async function onAgreementPullRequestMerged(
  github: GitHubGateway,
  input: { number: number; body: string | null; labels: string[]; merged: boolean },
): Promise<void> {
  if (!input.merged) return;
  const cfg = await config(github);
  if (!input.labels.includes(cfg.labels.agreement)) return;
  const metadata = parsePrMetadata(input.body);
  if (!metadata) return;
  const registry = parseRegistry(await github.readText(cfg.agreementRegistryPath));
  const entry = findAgreement(
    registry,
    metadata.githubId,
    metadata.agreementVersion,
    github.fullName(),
  );
  if (
    !entry ||
    entry.issueNodeId !== metadata.issueNodeId ||
    entry.contributionPullRequestNumber !== metadata.contributionPullRequestNumber
  )
    throw new Error("Merged agreement registry entry does not match the Agreement PR metadata.");
  const contribution = await github.getPull(entry.contributionPullRequestNumber);
  if (contribution.state === "open")
    await github.setCheck(
      contribution.head.sha,
      cfg.statusCheckName,
      "success",
      `Agreement PR #${input.number} merged; CLA ${entry.agreementVersion} is now authoritative.`,
    );
}

function extractMarkerPr(body: string): number | null {
  const match = body.match(/<!-- github-cla:([^ ]+) -->/);
  if (!match?.[1]) return null;
  try {
    const value = JSON.parse(Buffer.from(match[1], "base64url").toString("utf8"));
    return Number.isSafeInteger(value.pullRequestNumber) ? value.pullRequestNumber : null;
  } catch {
    return null;
  }
}

interface AgreementPullRequestMetadata {
  githubId: number;
  agreementVersion: string;
  issueNodeId: string;
  contributionPullRequestNumber: number;
}

function parsePrMetadata(body: string | null): AgreementPullRequestMetadata | null {
  const match = body?.match(/<!-- github-cla-pr:([^ ]+) -->/);
  if (!match?.[1]) return null;

  try {
    const value: unknown = JSON.parse(Buffer.from(match[1], "base64url").toString("utf8"));
    if (typeof value !== "object" || value === null) return null;
    const candidate = value as Record<string, unknown>;
    if (
      typeof candidate.githubId !== "number" ||
      typeof candidate.agreementVersion !== "string" ||
      typeof candidate.issueNodeId !== "string" ||
      typeof candidate.contributionPullRequestNumber !== "number"
    ) {
      return null;
    }
    return {
      githubId: candidate.githubId,
      agreementVersion: candidate.agreementVersion,
      issueNodeId: candidate.issueNodeId,
      contributionPullRequestNumber: candidate.contributionPullRequestNumber,
    };
  } catch {
    return null;
  }
}
