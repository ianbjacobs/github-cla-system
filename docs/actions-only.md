# Actions-only architecture

## Workflows

### Create Agreement PR

Triggered by `issues.opened`. It validates the signing Issue Form, derives identity and issue provenance from the trusted event payload, updates `AGREEMENTS.yaml` on a deterministic branch, and opens a PR labeled `agreement` with `Closes #<issue>`.

### Contributor Agreement

Triggered by `pull_request_target` for opened, reopened, synchronized, labeled, and unlabeled PRs. The workflow explicitly checks out the default branch and never checks out the contributor branch. It evaluates the pull request author's numeric GitHub ID against the canonical default-branch registry.

A generated Agreement PR is exempt only when all three conditions hold:

- the PR has the `agreement` label;
- its head branch starts with `agreement/`; and
- its head repository is the same trusted repository as the base repository.

This prevents a fork from imitating the label and branch name to bypass enforcement.

## Security boundary

The enforcement workflow must not run contributor-provided scripts or check out the PR head. `pull_request_target` has elevated trust relative to `pull_request`, so all executable files must come from the trusted default branch.

## Re-evaluation

A failed contribution PR does not automatically receive a new workflow run when an unrelated Agreement PR changes the registry. Maintainers may re-run the failed job, reopen the PR, or ask the contributor to synchronize it. Automatic refresh is reserved for A4.
