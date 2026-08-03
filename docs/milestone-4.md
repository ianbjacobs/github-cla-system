# Milestone 4: CLA enforcement

Milestone 4 makes the agreement registry enforceable through GitHub Check Runs.

## Evaluation triggers

The app evaluates a contribution pull request when it is opened, reopened, or synchronized. It also re-evaluates open contribution pull requests after an Agreement PR merges and after a push to the repository default branch.

## Authorization rule

A contribution pull request succeeds when `AGREEMENTS.yaml` contains an entry matching all of the following:

- the pull request author's immutable numeric GitHub user ID;
- the configured agreement version; and
- the repository full name.

Otherwise, the configured CLA check fails with instructions to use the **Sign Contributor Agreement** Issue Form and wait for a maintainer to merge the generated Agreement PR.

## Agreement PR exemption

Generated Agreement PRs contain a signed metadata marker in the PR body. The webhook dispatcher ignores those PRs for enforcement so an Agreement PR does not require the agreement it is proposing to record.

## Default-branch updates

A push to the repository's default branch causes all open, non-Agreement pull requests to be evaluated again. This covers merged registry changes, configuration changes, and manual registry corrections. Pushes to other branches are ignored.
