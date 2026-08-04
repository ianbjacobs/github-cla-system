import { describe, expect, it, vi } from "vitest";
import { onContributionPullRequest, onDefaultBranchPush } from "../src/application/handlers.js";
import { serializeRegistry } from "../src/application/registry.js";

const entry = {
  githubId: 42,
  githubNodeId: "U_42",
  githubLogin: "octocat",
  agreementVersion: "1.0",
  agreementPath: ".github/cla/agreement.md",
  agreementCommit: "abcdef1234567",
  signedAt: "2026-08-03T12:00:00.000Z",
  repository: "owner/repo",
  scope: "repository",
  scopeOwner: "owner",
  issueNumber: 9,
  issueNodeId: "I_9",
  recordPath: "agreements/42/1.0.yaml",
};
function gateway(registry, configuration = null) {
  const policy = {
    readText: vi.fn(async (path) => (path === "AGREEMENTS.yaml" ? registry : null)),
  };
  return {
    readText: vi.fn(async (path) => {
      if (path === ".github/cla/config.yml") return configuration;
      if (path === "AGREEMENTS.yaml") return registry;
      return null;
    }),
    forRepository: vi.fn(() => policy),
    fullName: vi.fn(() => "owner/repo"),
    setCheck: vi.fn(async () => undefined),
    listOpenPullRequests: vi.fn(async () => []),
  };
}
describe("CLA enforcement", () => {
  it("passes a contribution PR for a matching numeric GitHub user ID", async () => {
    const github = gateway(serializeRegistry({ schemaVersion: 1, agreements: [entry] }));
    await onContributionPullRequest(github, {
      contributor: { id: 42, nodeId: "U_42", login: "renamed-octocat" },
      number: 7,
      headSha: "abc123",
    });
    expect(github.setCheck).toHaveBeenCalledWith(
      "abc123",
      "Contributor License Agreement",
      "success",
      expect.stringContaining("GitHub user ID 42"),
    );
  });
  it("fails a contribution PR when no matching agreement exists", async () => {
    const github = gateway(serializeRegistry({ schemaVersion: 1, agreements: [] }));
    await onContributionPullRequest(github, {
      contributor: { id: 84, nodeId: "U_84", login: "unsigned" },
      number: 8,
      headSha: "def456",
    });
    expect(github.setCheck).toHaveBeenCalledWith(
      "def456",
      "Contributor License Agreement",
      "failure",
      expect.stringContaining("GitHub user ID 84"),
    );
  });
  it("reads an organization-wide registry from the configured policy repository", async () => {
    const organizationEntry = {
      ...entry,
      repository: "owner/source-repo",
      scope: "organization",
      scopeOwner: "owner",
    };
    const github = gateway(
      serializeRegistry({ schemaVersion: 1, agreements: [organizationEntry] }),
      "agreementScope: organization\npolicyRepository: owner/contributor-agreements\n",
    );
    await onContributionPullRequest(github, {
      contributor: { id: 42, nodeId: "U_42", login: "octocat" },
      number: 11,
      headSha: "organization123",
    });
    expect(github.forRepository).toHaveBeenCalledWith({
      owner: "owner",
      repo: "contributor-agreements",
    });
    expect(github.setCheck).toHaveBeenCalledWith(
      "organization123",
      "Contributor License Agreement",
      "success",
      expect.any(String),
    );
  });
  it("re-evaluates open contribution PRs and skips Agreement PRs", async () => {
    const github = gateway(serializeRegistry({ schemaVersion: 1, agreements: [entry] }));
    vi.mocked(github.listOpenPullRequests).mockResolvedValue([
      {
        number: 7,
        headSha: "abc123",
        labels: [],
        contributor: { id: 42, nodeId: "U_42", login: "octocat" },
      },
      {
        number: 10,
        headSha: "agreement123",
        labels: ["agreement"],
        contributor: { id: 42, nodeId: "U_42", login: "octocat" },
      },
    ]);
    await onDefaultBranchPush(github);
    expect(github.setCheck).toHaveBeenCalledTimes(1);
    expect(github.setCheck).toHaveBeenCalledWith(
      "abc123",
      "Contributor License Agreement",
      "success",
      expect.any(String),
    );
  });
});
