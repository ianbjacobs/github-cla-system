import { describe, expect, it, vi } from "vitest";
import { refreshOpenPullRequests } from "../lib/refresh.js";
import { serializeRegistry } from "../lib/registry.js";

const registrySource = serializeRegistry({
  agreementVersion: "1.0",
  agreements: [
    {
      githubId: 42,
      githubNodeId: "U_42",
      githubLogin: "octocat",
      agreementVersion: "1.0",
      signedAt: "2026-08-03T12:00:00.000Z",
      issueNumber: 7,
      issueNodeId: "I_7",
    },
  ],
});

function pullRequest(number, id, login) {
  return {
    number,
    user: { id, login },
    labels: [],
    head: { sha: `sha-${number}`, ref: `feature-${number}`, repo: { full_name: "fork/repo" } },
  };
}

describe("open pull request refresh", () => {
  it("publishes current results for every open contribution PR", async () => {
    const publishStatus = vi.fn();
    const results = await refreshOpenPullRequests({
      repository: "owner/repo",
      registrySource,
      listPullRequests: async () => [pullRequest(1, 42, "octocat"), pullRequest(2, 99, "new-user")],
      publishStatus,
    });

    expect(results.map((result) => result.state)).toEqual(["success", "failure"]);
    expect(publishStatus).toHaveBeenCalledTimes(2);
    expect(publishStatus).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ sha: "sha-1", state: "success" }),
    );
  });

  it("skips malformed pull request records", async () => {
    const publishStatus = vi.fn();
    const results = await refreshOpenPullRequests({
      repository: "owner/repo",
      registrySource,
      listPullRequests: async () => [{ number: 1 }],
      publishStatus,
    });
    expect(results).toEqual([]);
    expect(publishStatus).not.toHaveBeenCalled();
  });
});
