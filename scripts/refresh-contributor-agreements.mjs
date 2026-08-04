import { readFile } from "node:fs/promises";
import { refreshOpenPullRequests } from "../lib/refresh.js";

const repository = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const apiUrl = process.env.GITHUB_API_URL ?? "https://api.github.com";
const runUrl = `${process.env.GITHUB_SERVER_URL}/${repository}/actions/runs/${process.env.GITHUB_RUN_ID}`;
if (!repository || !token) throw new Error("GITHUB_REPOSITORY and GITHUB_TOKEN are required.");

async function request(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "x-github-api-version": "2022-11-28",
      ...options.headers,
    },
  });
  if (!response.ok) throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
  return response.status === 204 ? null : response.json();
}

const results = await refreshOpenPullRequests({
  repository,
  registrySource: await readFile("AGREEMENTS.yaml", "utf8"),
  listPullRequests: () => request(`/repos/${repository}/pulls?state=open&per_page=100`),
  publishStatus: ({ sha, state, context, description }) =>
    request(`/repos/${repository}/statuses/${sha}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ state, context, description, target_url: runUrl }),
    }),
});
console.log(`Refreshed ${results.length} open pull request(s).`);
