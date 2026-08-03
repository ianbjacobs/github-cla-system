import type { Octokit } from "@octokit/rest";
import type { RepositoryRef } from "../../domain/types.js";

export class GitHubGateway {
  constructor(
    private readonly octokit: Octokit,
    readonly repository: RepositoryRef,
  ) {}

  private get params(): { owner: string; repo: string } {
    return { owner: this.repository.owner, repo: this.repository.repo };
  }

  fullName(): string {
    return `${this.repository.owner}/${this.repository.repo}`;
  }

  async defaultBranch(): Promise<string> {
    return (await this.octokit.repos.get({ ...this.params })).data.default_branch;
  }

  async readText(path: string, ref?: string): Promise<string | null> {
    try {
      const request = ref ? { ...this.params, path, ref } : { ...this.params, path };
      const response = await this.octokit.repos.getContent(request);
      if (
        Array.isArray(response.data) ||
        response.data.type !== "file" ||
        !("content" in response.data)
      )
        throw new Error(`${path} is not a file.`);
      return Buffer.from(response.data.content.replace(/\n/g, ""), "base64").toString("utf8");
    } catch (error: unknown) {
      if (typeof error === "object" && error && "status" in error && error.status === 404)
        return null;
      throw error;
    }
  }

  async readTextWithSha(
    path: string,
    ref?: string,
  ): Promise<{ content: string; sha: string } | null> {
    try {
      const request = ref ? { ...this.params, path, ref } : { ...this.params, path };
      const response = await this.octokit.repos.getContent(request);
      if (
        Array.isArray(response.data) ||
        response.data.type !== "file" ||
        !("content" in response.data)
      ) {
        throw new Error(`${path} is not a file.`);
      }
      return {
        content: Buffer.from(response.data.content.replace(/\n/g, ""), "base64").toString("utf8"),
        sha: response.data.sha,
      };
    } catch (error: unknown) {
      if (typeof error === "object" && error && "status" in error && error.status === 404)
        return null;
      throw error;
    }
  }

  async ensureLabel(name: string, color: string, description: string): Promise<void> {
    try {
      await this.octokit.issues.getLabel({ ...this.params, name });
    } catch (error: unknown) {
      if (!(typeof error === "object" && error && "status" in error && error.status === 404))
        throw error;
      try {
        await this.octokit.issues.createLabel({ ...this.params, name, color, description });
      } catch (createError: unknown) {
        if (
          !(
            typeof createError === "object" &&
            createError &&
            "status" in createError &&
            createError.status === 422
          )
        )
          throw createError;
      }
    }
  }

  async setCheck(
    sha: string,
    name: string,
    state: "pending" | "success" | "failure",
    summary: string,
  ): Promise<void> {
    const list = await this.octokit.checks.listForRef({
      ...this.params,
      ref: sha,
      check_name: name,
      filter: "latest",
      per_page: 100,
    });
    const existing = list.data.check_runs.find((run) => run.name === name);
    const output = {
      title:
        state === "success"
          ? "CLA signed"
          : state === "failure"
            ? "CLA validation failed"
            : "CLA required",
      summary,
    };

    if (state === "pending") {
      if (existing) {
        await this.octokit.checks.update({
          ...this.params,
          check_run_id: existing.id,
          name,
          status: "in_progress",
          output,
        });
      } else {
        await this.octokit.checks.create({
          ...this.params,
          head_sha: sha,
          name,
          status: "in_progress",
          output,
        });
      }
      return;
    }

    const conclusion = state === "success" ? "success" : "failure";
    if (existing) {
      await this.octokit.checks.update({
        ...this.params,
        check_run_id: existing.id,
        name,
        status: "completed",
        conclusion,
        output,
      });
    } else {
      await this.octokit.checks.create({
        ...this.params,
        head_sha: sha,
        name,
        status: "completed",
        conclusion,
        output,
      });
    }
  }

  async getPull(number: number) {
    return (await this.octokit.pulls.get({ ...this.params, pull_number: number })).data;
  }
  async getIssue(number: number) {
    return (await this.octokit.issues.get({ ...this.params, issue_number: number })).data;
  }
  async comment(number: number, body: string) {
    await this.octokit.issues.createComment({ ...this.params, issue_number: number, body });
  }
  async closeIssue(number: number, labels: string[]) {
    await this.octokit.issues.update({
      ...this.params,
      issue_number: number,
      state: "closed",
      labels,
    });
  }

  async createAgreementPr(input: {
    branch: string;
    base: string;
    files: Array<{ path: string; content: string }>;
    entry: Record<string, unknown>;
    registryPath: string;
    label: string;
  }): Promise<{ number: number; nodeId: string; url: string; sha: string }> {
    const existing = await this.octokit.pulls.list({
      ...this.params,
      state: "open",
      head: `${this.repository.owner}:${input.branch}`,
      per_page: 10,
    });
    if (existing.data[0]) {
      return {
        number: existing.data[0].number,
        nodeId: existing.data[0].node_id,
        url: existing.data[0].html_url,
        sha: existing.data[0].head.sha,
      };
    }

    const baseRef = await this.octokit.git.getRef({ ...this.params, ref: `heads/${input.base}` });
    try {
      await this.octokit.git.createRef({
        ...this.params,
        ref: `refs/heads/${input.branch}`,
        sha: baseRef.data.object.sha,
      });
    } catch (error: unknown) {
      if (!(typeof error === "object" && error && "status" in error && error.status === 422)) {
        throw error;
      }
    }

    const commitSha = await this.commitFiles(
      input.branch,
      input.files,
      `Record CLA for ${String(input.entry.githubLogin)}`,
    );
    const metadata = Buffer.from(
      JSON.stringify({ schemaVersion: 1, ...input.entry, registryPath: input.registryPath }),
      "utf8",
    ).toString("base64url");
    const pr = await this.octokit.pulls.create({
      ...this.params,
      title: `Record CLA for @${String(input.entry.githubLogin)}`,
      head: input.branch,
      base: input.base,
      body: `<!-- github-cla-pr:${metadata} -->\n\nAdds an immutable agreement record and updates \`${input.registryPath}\`.\n\nA maintainer must verify the source issue before merging.`,
      maintainer_can_modify: true,
    });
    await this.ensureLabel(input.label, "0e8a16", "Contributor agreement pull request");
    await this.octokit.issues.addLabels({
      ...this.params,
      issue_number: pr.data.number,
      labels: [input.label],
    });
    return {
      number: pr.data.number,
      nodeId: pr.data.node_id,
      url: pr.data.html_url,
      sha: commitSha,
    };
  }

  async listOpenPullRequestsByAuthor(
    login: string,
  ): Promise<Array<{ number: number; headSha: string }>> {
    const pullRequests = await this.octokit.paginate(this.octokit.pulls.list, {
      ...this.params,
      state: "open",
      per_page: 100,
    });
    return pullRequests
      .filter((pullRequest) => pullRequest.user?.login.toLowerCase() === login.toLowerCase())
      .map((pullRequest) => ({ number: pullRequest.number, headSha: pullRequest.head.sha }));
  }

  private async commitFiles(
    branch: string,
    files: Array<{ path: string; content: string }>,
    message: string,
  ): Promise<string> {
    const ref = await this.octokit.git.getRef({ ...this.params, ref: `heads/${branch}` });
    const parent = await this.octokit.git.getCommit({
      ...this.params,
      commit_sha: ref.data.object.sha,
    });
    const treeEntries = await Promise.all(
      files.map(async (file) => {
        const blob = await this.octokit.git.createBlob({
          ...this.params,
          content: file.content,
          encoding: "utf-8",
        });
        return {
          path: file.path,
          mode: "100644" as const,
          type: "blob" as const,
          sha: blob.data.sha,
        };
      }),
    );
    const tree = await this.octokit.git.createTree({
      ...this.params,
      base_tree: parent.data.tree.sha,
      tree: treeEntries,
    });
    const commit = await this.octokit.git.createCommit({
      ...this.params,
      message,
      tree: tree.data.sha,
      parents: [ref.data.object.sha],
    });
    await this.octokit.git.updateRef({
      ...this.params,
      ref: `heads/${branch}`,
      sha: commit.data.sha,
      force: false,
    });
    return commit.data.sha;
  }
}
