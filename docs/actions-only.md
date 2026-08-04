# Actions-only architecture

## Create Agreement PR

`.github/workflows/create-agreement-pr.yml` runs for newly opened issues carrying the `pending-agreement` label. It validates the exact Issue Form acknowledgements, reads contributor identity and issue provenance from the trusted event payload, updates `CLA_REGISTRY.yaml` on a deterministic branch, and opens a pull request labeled `agreement` with `Closes #<issue>`.

Permissions: `contents: write`, `issues: write`, and `pull-requests: write`.

## Contributor Agreement

`.github/workflows/check-contributor-agreement.yml` runs on `pull_request_target` for opened, reopened, synchronized, labeled, and unlabeled pull requests. It explicitly checks out the trusted default branch and never checks out or executes the contributor branch.

It evaluates the PR author's immutable numeric GitHub ID against `CLA_REGISTRY.yaml`, publishes the required `Contributor Agreement` commit status on the PR head SHA, and manages one signing-instructions comment while the contributor is unsigned.

A generated agreement PR is exempt only when its head branch starts with `agreement/` and its head repository is the same repository as the base. The label is not required for the exemption because GitHub may emit the PR-opened event before automation attaches the label.

Permissions: `contents: read`, `issues: write`, `pull-requests: write`, and `statuses: write`.

## Refresh Contributor Agreements

`.github/workflows/refresh-contributor-agreements.yml` runs when `CLA_REGISTRY.yaml` changes on the default branch. It re-evaluates open pull requests, republishes the same required status, and creates, updates, or removes the managed signing comment as appropriate.

Permissions: `contents: read`, `issues: write`, `pull-requests: read`, and `statuses: write`.

The current implementation processes the first 100 open pull requests returned by GitHub.

## Trust model

- `CLA_REGISTRY.yaml` on the default branch is the sole authorization source.
- Signing issue identity comes from the authenticated GitHub event payload, not user-entered text.
- Agreement records are proposed by automation and accepted only when a maintainer merges the generated PR.
- Login changes do not affect authorization because matching uses the numeric GitHub user ID.

## Required branch rule

Require the exact status context:

```text
Contributor Agreement
```

Do not use the workflow job name as the merge gate; the explicit commit-status context is shared by initial evaluation and registry refresh.
