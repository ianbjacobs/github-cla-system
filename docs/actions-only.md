# Actions-only architecture

The project uses GitHub Actions rather than a hosted webhook service.

## Agreement creation

`.github/workflows/create-agreement-pr.yml` runs when a labeled signing issue is opened. It:

1. checks out the trusted default branch;
2. validates the required acknowledgements;
3. reads contributor and issue identity from the GitHub event payload;
4. updates `AGREEMENTS.yaml` in the runner workspace;
5. commits that change to a deterministic agreement branch;
6. opens a pull request labeled `agreement`;
7. comments on the signing issue with the pull-request URL.

The PR body includes `Closes #<issue>`. The signing issue therefore remains open until a maintainer merges the Agreement PR. The default branch's `AGREEMENTS.yaml` is unchanged until that merge.

## Repository setting

The repository or organization must allow GitHub Actions to create pull requests. In repository settings, open **Actions → General → Workflow permissions**, select **Read and write permissions**, and enable **Allow GitHub Actions to create and approve pull requests**. The workflow does not approve its own PR.

## Token model

A2 uses the repository-provided `GITHUB_TOKEN`. No PAT, GitHub App key, webhook endpoint, or hosted process is required. PRs created with `GITHUB_TOKEN` can have downstream-workflow limitations; the Agreement PR is intended for maintainer review and merge, and A3 will keep contribution enforcement independent of the generated PR branch.
