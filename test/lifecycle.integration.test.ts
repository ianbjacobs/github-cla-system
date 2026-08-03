import { describe, expect, it, vi } from "vitest";
import {
  onAgreementPullRequestMerged,
  onContributionPullRequest,
  onSigningIssue,
} from "../src/application/handlers.js";
import type { AgreementEntry } from "../src/domain/types.js";
import type { GitHubGateway } from "../src/infrastructure/github/gateway.js";

const acceptanceBody = [
  "- [x] I have read and agree to the Contributor License Agreement.",
  "- [x] I am submitting this agreement for my own authenticated GitHub account.",
].join("\n");

describe("contributor agreement lifecycle", () => {
  it("moves an unsigned contributor from failed check to merged agreement authorization", async () => {
    let registry: string | null = null;
    let generated:
      | {
          entry: AgreementEntry;
          files: Array<{ path: string; content: string }>;
          branch: string;
        }
      | undefined;

    const setCheck = vi.fn(async () => undefined);
    const comment = vi.fn(async () => undefined);
    const closeIssue = vi.fn(async () => undefined);

    const github = {
      repository: { owner: "owner", repo: "repo" },
      fullName: () => "owner/repo",
      forRepository: vi.fn(() => {
        throw new Error("Organization policy repository was not expected in this test.");
      }),
      readText: vi.fn(async (path: string) => {
        if (path === ".github/cla/config.yml") return null;
        if (path === "AGREEMENTS.yaml") return registry;
        return null;
      }),
      readTextWithSha: vi.fn(async (path: string) =>
        path === ".github/cla/agreement.md"
          ? { content: "Canonical agreement", sha: "agreement-blob-sha" }
          : null,
      ),
      defaultBranch: vi.fn(async () => "main"),
      createAgreementPr: vi.fn(
        async (input: {
          branch: string;
          files: Array<{ path: string; content: string }>;
          entry: AgreementEntry;
        }) => {
          generated = {
            entry: input.entry,
            files: input.files,
            branch: input.branch,
          };
          return {
            number: 12,
            nodeId: "PR_12",
            url: "https://github.example/owner/repo/pull/12",
            sha: "agreement-pr-sha",
          };
        },
      ),
      setCheck,
      comment,
      closeIssue,
      listOpenPullRequestsByAuthor: vi.fn(async () => [{ number: 7, headSha: "contribution-sha" }]),
    } as unknown as GitHubGateway;

    const contributor = { id: 42, nodeId: "U_42", login: "Octocat" };

    await onContributionPullRequest(github, {
      contributor,
      number: 7,
      headSha: "contribution-sha",
    });
    expect(setCheck).toHaveBeenLastCalledWith(
      "contribution-sha",
      "Contributor License Agreement",
      "failure",
      expect.stringContaining("GitHub user ID 42"),
    );

    await onSigningIssue(github, {
      issueNumber: 9,
      author: contributor,
      body: acceptanceBody,
      nodeId: "I_9",
      createdAt: "2026-08-03T12:00:00.000Z",
    });

    if (!generated) throw new Error("Expected an Agreement PR to be generated.");

    expect(generated.branch).toBe("cla/42/9/1.0");
    expect(generated.entry).toMatchObject({
      githubId: 42,
      githubNodeId: "U_42",
      issueNodeId: "I_9",
      agreementCommit: "agreement-blob-sha",
    });
    expect(generated.files.map((file) => file.path)).toEqual([
      "agreements/42/1.0.yaml",
      "AGREEMENTS.yaml",
    ]);
    expect(comment).toHaveBeenCalledWith(9, expect.stringContaining("pull/12"));
    expect(closeIssue).toHaveBeenCalledWith(9, ["agreement"]);

    registry = generated.files.find((file) => file.path === "AGREEMENTS.yaml")?.content ?? null;
    expect(registry).not.toBeNull();

    const metadata = Buffer.from(
      JSON.stringify({ schemaVersion: 1, ...generated.entry, registryPath: "AGREEMENTS.yaml" }),
      "utf8",
    ).toString("base64url");

    await onAgreementPullRequestMerged(github, {
      number: 12,
      body: `<!-- github-cla-pr:${metadata} -->`,
      labels: ["agreement"],
      merged: true,
    });

    expect(setCheck).toHaveBeenLastCalledWith(
      "contribution-sha",
      "Contributor License Agreement",
      "success",
      expect.stringContaining("Agreement PR #12 merged"),
    );
  });
});
