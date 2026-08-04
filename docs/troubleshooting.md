# Troubleshooting

## The signing Issue Form is missing

- Confirm `.github/ISSUE_TEMPLATE/sign-contributor-agreement.yml` is on the default branch.
- Confirm Issues are enabled.
- Confirm the Issue Form YAML is valid.

## A signing issue does not create an agreement PR

- Confirm the issue has the exact `pending-agreement` label.
- Create that label in the repository before testing; Issue Forms do not create missing labels.
- Inspect the `Create Agreement PR` workflow run.
- Confirm Actions has write permission and may create pull requests.

## An agreement PR fails the CLA status

The head branch must begin with `agreement/` and must belong to the base repository. Create a new workflow event after updating trusted default-branch code; rerunning an old workflow reuses its original event payload.

## An unsigned PR has a green Actions job

The job can execute successfully while publishing a failing `Contributor Agreement` commit status. Protect the branch using the explicit `Contributor Agreement` status, not only the job named `Evaluate contributor agreement`.

## The signing comment does not disappear immediately

Reload the pull-request page after the agreement PR merges. If it remains, inspect the latest `Refresh Contributor Agreements` run.

## Local validation fails

Run:

```bash
npm run format
npm run check
```

Commit formatter changes to the PR's head branch; changing only the base branch does not update validation of an existing PR head.
