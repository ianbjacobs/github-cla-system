# GitHub CLA Actions

An Actions-only contributor agreement workflow. It requires no hosted server, webhook endpoint, database, GitHub App private key, or long-running process.

## Current release: A2

A2 automatically turns a valid **Sign Contributor Agreement** issue into a proposed update to `AGREEMENTS.yaml`:

1. The contributor opens the Issue Form and checks both required acknowledgements.
2. GitHub Actions reads the authenticated user and issue metadata from the event payload.
3. The workflow creates `agreement/<github-id>/issue-<number>`.
4. It updates `AGREEMENTS.yaml` on that branch only.
5. It opens a pull request labeled `agreement` whose body contains `Closes #<issue>`.
6. A maintainer reviews and merges the PR.
7. Only the merge changes the canonical registry on the default branch and closes the signing issue.

A3 will add required-check enforcement for contribution pull requests.

## Setup

1. Replace `agreement/CONTRIBUTOR_AGREEMENT.md` and the Issue Form placeholder with approved agreement text.
2. Commit `.github/ISSUE_TEMPLATE/sign-contributor-agreement.yml` and `.github/workflows/create-agreement-pr.yml` to the default branch.
3. In **Settings → Actions → General → Workflow permissions**, grant read/write permissions and allow Actions to create pull requests.
4. Ensure branch protection allows maintainers to merge Agreement PRs.

See [docs/actions-only.md](docs/actions-only.md) for the architecture and token model.

## Development

```bash
npm install
npm run format
npm run check
```

## Registry trust model

`AGREEMENTS.yaml` on the default branch is authoritative. An opened issue is an attestation; an opened Agreement PR is a proposal; a merged Agreement PR is acceptance.
