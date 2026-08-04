export class GitHubGateway {
  octokit;
  repository;
  constructor(octokit, repository) {
    this.octokit = octokit;
    this.repository = repository;
  }
  get params() {
    return { owner: this.repository.owner, repo: this.repository.repo };
  }
  fullName() {
    return `${this.repository.owner}/${this.repository.repo}`;
  }
  forRepository(repository) {
    return new GitHubGateway(this.octokit, repository);
  }
  async defaultBranch() {
    return (await this.octokit.repos.get({ ...this.params })).data.default_branch;
  }
  async readText(path, ref) {
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
    } catch (error) {
      if (typeof error === "object" && error && "status" in error && error.status === 404)
        return null;
      throw error;
    }
  }
  async readTextWithSha(path, ref) {
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
    } catch (error) {
      if (typeof error === "object" && error && "status" in error && error.status === 404)
        return null;
      throw error;
    }
  }
  async ensureLabel(name, color, description) {
    try {
      await this.octokit.issues.getLabel({ ...this.params, name });
    } catch (error) {
      if (!(typeof error === "object" && error && "status" in error && error.status === 404))
        throw error;
      try {
        await this.octokit.issues.createLabel({ ...this.params, name, color, description });
      } catch (createError) {
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
  async setCheck(sha, name, state, summary) {
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
  async getPull(number) {
    return (await this.octokit.pulls.get({ ...this.params, pull_number: number })).data;
  }
  async getIssue(number) {
    return (await this.octokit.issues.get({ ...this.params, issue_number: number })).data;
  }
  async comment(number, body) {
    await this.octokit.issues.createComment({ ...this.params, issue_number: number, body });
  }
  async closeIssue(number, labels) {
    await this.octokit.issues.update({
      ...this.params,
      issue_number: number,
      state: "closed",
      labels,
    });
  }
  async createAgreementPr(input) {
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
    } catch (error) {
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
      body: [
        `<!-- github-cla-pr:${metadata} -->`,
        "",
        `Adds an immutable agreement record and updates \`${input.registryPath}\`.`,
        "",
        "A maintainer must verify the source issue before merging.",
      ].join("\n"),
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
  async listOpenPullRequests() {
    const pullRequests = await this.octokit.paginate(this.octokit.pulls.list, {
      ...this.params,
      state: "open",
      per_page: 100,
    });
    return pullRequests.map((pullRequest) => ({
      number: pullRequest.number,
      headSha: pullRequest.head.sha,
      labels: pullRequest.labels.flatMap((label) =>
        typeof label.name === "string" && label.name.length > 0 ? [label.name] : [],
      ),
      contributor: pullRequest.user
        ? {
            id: pullRequest.user.id,
            nodeId: pullRequest.user.node_id,
            login: pullRequest.user.login,
          }
        : null,
    }));
  }
  async listOpenPullRequestsByAuthor(login) {
    const pullRequests = await this.listOpenPullRequests();
    return pullRequests
      .filter((pullRequest) => pullRequest.contributor?.login.toLowerCase() === login.toLowerCase())
      .map((pullRequest) => ({ number: pullRequest.number, headSha: pullRequest.headSha }));
  }
  async commitFiles(branch, files, message) {
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
          mode: "100644",
          type: "blob",
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
