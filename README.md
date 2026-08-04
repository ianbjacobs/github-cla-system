# GitHub CLA Actions

An Actions-only contributor agreement workflow. It requires no hosted server, webhook endpoint, database, GitHub App private key, or long-running process.

## Release candidate: A4

The complete workflow is:

1. A contributor opens **Sign Contributor Agreement** and checks both acknowledgements.
2. GitHub Actions reads the authenticated user and issue metadata from the event payload.
3. The workflow creates `agreement/<github-id>/issue-<number>`.
4. It updates `AGREEMENTS.yaml` on that branch only.
5. It opens a pull request labeled `agreement` whose body contains `Closes #<issue>`.
6. A maintainer reviews and merges the Agreement PR.
7. Only the merge changes the canonical registry on the default branch and closes the signing issue.
8. Contribution PRs receive the required `Contributor Agreement` status.
9. When `AGREEMENTS.yaml` changes on the default branch, all open contribution PRs are re-evaluated automatically.

## Setup

1. Replace `agreement/CONTRIBUTOR_AGREEMENT.md` and the Issue Form placeholder with approved agreement text.
2. Commit the Issue Form and workflows to the default branch. This repository currently uses `actions-only`, but the workflows resolve `${{ github.event.repository.default_branch }}` dynamically.
3. In **Settings → Actions → General → Workflow permissions**, grant read/write permissions and enable **Allow GitHub Actions to create and approve pull requests**. The workflow creates PRs but does not approve them.
4. Configure a branch ruleset for the default branch that requires the status context `Contributor Agreement`.
5. Ensure only maintainers can merge Agreement PRs.

See [docs/actions-only.md](docs/actions-only.md) for architecture, security boundaries, permissions, and operations.

## Development

```bash
npm install
npm run format
npm run check
```

## Registry trust model

`AGREEMENTS.yaml` on the default branch is authoritative. An opened issue is a contributor attestation; an opened Agreement PR is a proposal; a merged Agreement PR is project acceptance.
