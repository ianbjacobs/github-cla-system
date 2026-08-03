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

  async createOrReuseSigningIssue(input: {
    login: string;
    githubId: number;
    prNumber: number;
    version: string;
    agreement: string;
    agreementLabel: string;
    pendingLabel: string;
  }): Promise<{ number: number; nodeId: string; url: string }> {
    await this.ensureLabel(input.agreementLabel, "0e8a16", "Contributor agreement workflow");
    await this.ensureLabel(input.pendingLabel, "fbca04", "Contributor agreement awaiting action");
    const marker = this.issueMarker(input);
    const issues = await this.octokit.paginate(this.octokit.issues.listForRepo, {
      ...this.params,
      state: "open",
      labels: `${input.agreementLabel},${input.pendingLabel}`,
      per_page: 100,
    });
    const existing = issues.find(
      (issue) => !("pull_request" in issue) && issue.body?.includes(marker),
    );
    if (existing)
      return { number: existing.number, nodeId: existing.node_id, url: existing.html_url };
    const body = [
      marker,
      "",
      "# Contributor License Agreement",
      "",
      `For **@${input.login}** and contribution PR **#${input.prNumber}**.`,
      "",
      `Agreement version: **${input.version}**`,
      "",
      "---",
      "",
      input.agreement.trim(),
      "",
      "---",
      "",
      "- [ ] I have read and agree to the Contributor License Agreement.",
      "",
      "- [ ] I am submitting this agreement for my own authenticated GitHub account.",
      "",
    ].join("\n");
    const issue = await this.octokit.issues.create({
      ...this.params,
      title: `Contributor License Agreement for @${input.login}`,
      body,
      labels: [input.agreementLabel, input.pendingLabel],
    });
    return { number: issue.data.number, nodeId: issue.data.node_id, url: issue.data.html_url };
  }

  issueMarker(input: {
    login: string;
    githubId: number;
    prNumber: number;
    version: string;
  }): string {
    return `<!-- github-cla:${Buffer.from(JSON.stringify({ schemaVersion: 1, contributorLogin: input.login, contributorId: input.githubId, pullRequestNumber: input.prNumber, agreementVersion: input.version }), "utf8").toString("base64url")} -->`;
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
    registryPath: string;
    registryContent: string;
    entry: Record<string, unknown>;
    label: string;
  }): Promise<{ number: number; nodeId: string; url: string; sha: string }> {
    const existing = await this.octokit.pulls.list({
      ...this.params,
      state: "open",
      head: `${this.repository.owner}:${input.branch}`,
      per_page: 10,
    });
    if (existing.data[0])
      return {
        number: existing.data[0].number,
        nodeId: existing.data[0].node_id,
        url: existing.data[0].html_url,
        sha: existing.data[0].head.sha,
      };
    const baseRef = await this.octokit.git.getRef({ ...this.params, ref: `heads/${input.base}` });
    try {
      await this.octokit.git.createRef({
        ...this.params,
        ref: `refs/heads/${input.branch}`,
        sha: baseRef.data.object.sha,
      });
    } catch (error: unknown) {
      if (!(typeof error === "object" && error && "status" in error && error.status === 422))
        throw error;
    }
    const commitSha = await this.commitFile(
      input.branch,
      input.registryPath,
      input.registryContent,
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
      body: `<!-- github-cla-pr:${metadata} -->\n\nAdds the contributor to \`${input.registryPath}\`.\n\nA maintainer must verify the signing issue before merging.`,
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

  private async commitFile(
    branch: string,
    path: string,
    content: string,
    message: string,
  ): Promise<string> {
    const ref = await this.octokit.git.getRef({ ...this.params, ref: `heads/${branch}` });
    const parent = await this.octokit.git.getCommit({
      ...this.params,
      commit_sha: ref.data.object.sha,
    });
    const blob = await this.octokit.git.createBlob({ ...this.params, content, encoding: "utf-8" });
    const tree = await this.octokit.git.createTree({
      ...this.params,
      base_tree: parent.data.tree.sha,
      tree: [{ path, mode: "100644", type: "blob", sha: blob.data.sha }],
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
