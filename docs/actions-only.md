# Actions-only architecture

## Workflows

### Create Agreement PR

Triggered by `issues.opened`. It validates the signing Issue Form, derives identity and issue provenance from the trusted event payload, updates `AGREEMENTS.yaml` on a deterministic branch, and opens a PR labeled `agreement` with `Closes #<issue>`.

Permissions: `contents: write`, `issues: write`, and `pull-requests: write`.

### Contributor Agreement

Triggered by `pull_request_target` for opened, reopened, synchronized, labeled, and unlabeled PRs. The workflow explicitly checks out the default branch and never checks out the contributor branch. It evaluates the PR author's immutable numeric GitHub ID against the canonical registry and publishes the `Contributor Agreement` commit status on the PR head SHA.

A generated Agreement PR is exempt only when all three conditions hold:

- the PR has the `agreement` label;
- its head branch starts with `agreement/`; and
- its head repository is the same trusted repository as the base repository.

This prevents a fork from imitating the label and branch name to bypass enforcement.

Permissions: `contents: read` and `statuses: write`.

### Refresh Contributor Agreements

Triggered by a default-branch push that changes `AGREEMENTS.yaml`. It reads the updated canonical registry, lists open pull requests, re-evaluates each author, and republishes the same `Contributor Agreement` status on each PR head SHA.

Permissions: `contents: read`, `pull-requests: read`, and `statuses: write`.

## Security boundary

The enforcement workflows must not run contributor-provided scripts or check out a PR head. `pull_request_target` has elevated trust, so all executable files and the registry are explicitly loaded from the trusted default branch.

Authorization is based on the numeric GitHub user ID. Login names are retained only for readability and audit history.

## Required branch rule

Configure the default branch ruleset to require the status context:

```text
Contributor Agreement
```

Do not require the workflow job name as a separate check; A4 uses one explicit commit-status context for both normal PR evaluation and refresh after registry merges.

## Operational behavior

- Invalid signing issues receive a comment explaining which acknowledgements are missing.
- Existing current signers are informed and their redundant issue is closed.
- Valid signing issues remain open until the generated Agreement PR merges.
- Closing an Agreement PR without merging leaves the signing issue open.
- Merging an Agreement PR updates the canonical registry and automatically refreshes open contribution PRs.
- Refresh currently handles the first 100 open PRs returned by GitHub. Repositories with more than 100 simultaneous open PRs should add API pagination before production use.
