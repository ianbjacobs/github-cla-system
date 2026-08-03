import { CONFIG_PATH, parseRepositoryConfig } from "../config/repositoryConfig.js";
import type { AgreementEntry, ClaConfig, Contributor } from "../domain/types.js";
import { normalizeLogin } from "../domain/validation.js";
import type { GitHubGateway } from "../infrastructure/github/gateway.js";
import { acceptanceComplete } from "./issueForm.js";
import {
  addAgreement,
  findAgreement,
  parseRegistry,
  serializeAgreementRecord,
  serializeRegistry,
} from "./registry.js";

async function config(github: GitHubGateway): Promise<ClaConfig> {
  return parseRepositoryConfig(await github.readText(CONFIG_PATH));
}

function policyGateway(github: GitHubGateway, cfg: ClaConfig): GitHubGateway {
  return cfg.policyRepository ? github.forRepository(cfg.policyRepository) : github;
}

export async function onContributionPullRequest(
  github: GitHubGateway,
  input: { contributor: Contributor; number: number; headSha: string },
): Promise<void> {
  const cfg = await config(github);
  const policy = policyGateway(github, cfg);
  const registry = parseRegistry(await policy.readText(cfg.agreementRegistryPath));
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
    "failure",
    `No merged CLA ${cfg.agreementVersion} exists for GitHub user ID ${input.contributor.id}. Open the “Sign Contributor Agreement” issue form, then wait for a maintainer to merge the generated agreement PR.`,
  );
}

export async function onSigningIssue(
  github: GitHubGateway,
  input: {
    issueNumber: number;
    author: Contributor;
    body: string;
    nodeId: string;
    createdAt: string;
  },
): Promise<void> {
  const cfg = await config(github);

  if (!acceptanceComplete(input.body)) {
    await github.comment(
      input.issueNumber,
      "The required agreement checkboxes were not both selected. No agreement pull request was created.",
    );
    return;
  }

  const policy = policyGateway(github, cfg);
  const agreement = await policy.readTextWithSha(cfg.agreementTemplatePath);
  if (!agreement) throw new Error(`Agreement template ${cfg.agreementTemplatePath} is missing.`);

  const registry = parseRegistry(await policy.readText(cfg.agreementRegistryPath));
  const existing = findAgreement(
    registry,
    input.author.id,
    cfg.agreementVersion,
    github.fullName(),
  );
  if (existing) {
    await github.comment(
      input.issueNumber,
      `✅ CLA ${existing.agreementVersion} is already recorded for GitHub user ID ${existing.githubId}.`,
    );
    await github.closeIssue(input.issueNumber, [cfg.labels.agreement]);
    return;
  }

  const safeVersion = cfg.agreementVersion.replace(/[^a-z0-9._-]+/gi, "-");
  const recordPath = `${cfg.agreementRecordsDirectory}/${input.author.id}/${safeVersion}.yaml`;
  const entry: AgreementEntry = {
    githubId: input.author.id,
    githubNodeId: input.author.nodeId,
    githubLogin: normalizeLogin(input.author.login),
    agreementVersion: cfg.agreementVersion,
    agreementPath: cfg.agreementTemplatePath,
    agreementCommit: agreement.sha,
    signedAt: input.createdAt,
    repository: github.fullName(),
    scope: cfg.agreementScope,
    scopeOwner: github.repository.owner,
    issueNumber: input.issueNumber,
    issueNodeId: input.nodeId,
    recordPath,
  };
  const updatedRegistry = addAgreement(registry, entry);
  const branch = `cla/${input.author.id}/${input.issueNumber}/${safeVersion}`;
  const agreementPr = await policy.createAgreementPr({
    branch,
    base: await policy.defaultBranch(),
    files: [
      { path: recordPath, content: serializeAgreementRecord(entry) },
      { path: cfg.agreementRegistryPath, content: serializeRegistry(updatedRegistry) },
    ],
    entry,
    registryPath: cfg.agreementRegistryPath,
    label: cfg.labels.agreement,
  });

  await github.comment(
    input.issueNumber,
    `✅ Agreement PR opened: ${agreementPr.url}\n\nA maintainer must verify the checked agreement and merge that PR before the agreement becomes authoritative.`,
  );
  await github.closeIssue(input.issueNumber, [cfg.labels.agreement]);
}

export async function onDefaultBranchPush(github: GitHubGateway): Promise<void> {
  const cfg = await config(github);
  const pullRequests = await github.listOpenPullRequests();
  for (const pullRequest of pullRequests) {
    if (!pullRequest.contributor || pullRequest.labels.includes(cfg.labels.agreement)) continue;
    await onContributionPullRequest(github, {
      contributor: pullRequest.contributor,
      number: pullRequest.number,
      headSha: pullRequest.headSha,
    });
  }
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
    entry.recordPath !== metadata.recordPath ||
    entry.agreementCommit !== metadata.agreementCommit
  ) {
    throw new Error("Merged agreement registry entry does not match Agreement PR metadata.");
  }

  const openPullRequests = await github.listOpenPullRequestsByAuthor(entry.githubLogin);
  for (const pullRequest of openPullRequests) {
    await github.setCheck(
      pullRequest.headSha,
      cfg.statusCheckName,
      "success",
      `Agreement PR #${input.number} merged; CLA ${entry.agreementVersion} is now authoritative.`,
    );
  }
}

interface AgreementPullRequestMetadata {
  githubId: number;
  agreementVersion: string;
  agreementCommit: string;
  issueNodeId: string;
  recordPath: string;
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
      typeof candidate.agreementCommit !== "string" ||
      typeof candidate.issueNodeId !== "string" ||
      typeof candidate.recordPath !== "string"
    ) {
      return null;
    }
    return {
      githubId: candidate.githubId,
      agreementVersion: candidate.agreementVersion,
      agreementCommit: candidate.agreementCommit,
      issueNodeId: candidate.issueNodeId,
      recordPath: candidate.recordPath,
    };
  } catch {
    return null;
  }
}
