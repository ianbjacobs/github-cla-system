# Installation and configuration

This guide installs the current Actions-only system into a GitHub repository. The repository itself stores the agreement text, signing workflow, and accepted-agreement registry.

## Prerequisites

You need:

- administrator access to the target repository;
- GitHub Issues enabled;
- GitHub Actions enabled;
- permission to create labels and branch rulesets;
- an agreement approved for your project;
- Node.js 22 only if you plan to run the local test suite.

## 1. Copy the repository files

Copy these paths into the target repository, preserving their locations:

```text
.github/ISSUE_TEMPLATE/sign-contributor-agreement.yml
.github/workflows/check-contributor-agreement.yml
.github/workflows/close-signing-issue.yml
.github/workflows/create-agreement-pr.yml
.github/workflows/refresh-contributor-agreements.yml
agreement/CONTRIBUTOR_AGREEMENT.md
CLA_REGISTRY.yaml
lib/
scripts/
package.json
package-lock.json
```

The following are useful for developing or validating the system but are not required for runtime operation:

```text
.github/workflows/ci.yml
.github/workflows/release.yml
biome.json
tests/
```

## 2. Replace the placeholder agreement

Edit:

```text
agreement/CONTRIBUTOR_AGREEMENT.md
```

Replace the placeholder metadata and terms with the agreement approved for your project.

Then place the same complete agreement text in the first Markdown block of:

```text
.github/ISSUE_TEMPLATE/sign-contributor-agreement.yml
```

The Issue Form is what contributors actually attest to. Keep the repository document and Issue Form text synchronized.

Do not change these Issue Form field IDs unless you also update the parsing code and tests:

```text
target_branch
acceptance
identity
```

The `target_branch` value is prefilled by the signing link. It allows an Agreement pull request to update the same branch targeted by the contributor's pull request.

## 3. Create the required label

Create this repository label exactly:

```text
pending-agreement
```

The Issue Form applies it when a signing issue is opened. GitHub Issue Forms do not create missing labels automatically.

The workflow creates or updates the `agreement` label when it opens an Agreement pull request.

## 4. Configure GitHub Actions permissions

Open:

**Settings → Actions → General → Workflow permissions**

Select:

- **Read and write permissions**
- **Allow GitHub Actions to create and approve pull requests**

The workflows also declare their own least-privilege permissions. Collectively, the system needs to:

- read and update repository contents;
- create and label Agreement pull requests;
- comment on and close issues;
- comment on contributor pull requests;
- publish the `Contributor Agreement` commit status.

No repository secret or personal access token is required. The workflows use GitHub's automatically provided token.

## 5. Put the Issue Form and issue workflow on the default branch

GitHub loads Issue Forms and `issues` event workflows from the repository's default branch. Therefore, these files must be present on the default branch before signing can work:

```text
.github/ISSUE_TEMPLATE/sign-contributor-agreement.yml
.github/workflows/create-agreement-pr.yml
scripts/resolve-agreement-target-branch.mjs
```

A contributor pull request may target another protected branch. The signing link carries that base branch into the Issue Form, and the generated Agreement pull request targets the same branch.

## 6. Run the status once

Open a temporary pull request so the workflow publishes the exact status context:

```text
Contributor Agreement
```

GitHub normally requires a status to have been reported recently before it can be selected in a ruleset.

Do not require only the workflow job named `Evaluate contributor agreement`. That job may finish successfully while publishing a failing `Contributor Agreement` status for an unsigned contributor.

## 7. Configure a branch ruleset

Open:

**Settings → Rules → Rulesets**

Create or edit a branch ruleset and select every branch on which you want CLA enforcement, for example:

```text
main
release/*
```

Recommended rules:

1. Require a pull request before merging.
2. Require status checks to pass.
3. Add the exact required status:

   ```text
   Contributor Agreement
   ```

4. Add your normal review and conversation-resolution rules.
5. Decide whether repository administrators may bypass the ruleset.

Rulesets are repository configuration; copying the workflow files does not create or modify them.

## 8. Decide how maintainers may bypass rules

During initial setup, an owner or administrator bypass can be useful for repairing workflows or repository configuration. Signing the CLA does not permit direct pushes when a ruleset requires pull requests; those are separate controls.

For normal development, prefer feature branches and pull requests even when a bypass is available.

## 9. Verify the installation

Use a GitHub account whose numeric user ID is not already present in `CLA_REGISTRY.yaml`.

1. Open a contributor pull request targeting a protected branch.
2. Confirm the `Contributor Agreement` status fails.
3. Confirm one managed comment appears with a signing link.
4. Follow the link and confirm the Issue Form shows the correct **Target branch**.
5. Check both required acknowledgements and submit the issue.
6. Confirm an Agreement pull request is created with:
   - the expected target branch;
   - a head branch beginning with `agreement/`;
   - the `agreement` label;
   - only `CLA_REGISTRY.yaml` changed;
   - a green `Contributor Agreement` status.
7. Review the registry entry and merge the Agreement pull request.
8. Confirm the original contributor pull request turns green and the signing comment is removed.
9. Confirm the signing issue closes. GitHub's interface may take a short time to reflect the closure.

## Files commonly customized

You may normally customize:

- the agreement text and metadata;
- Issue Form display text;
- label colors and descriptions;
- the list of branches targeted by your ruleset;
- ordinary repository review policy.

Exercise care when changing:

- Issue Form field IDs;
- the `Contributor Agreement` status context;
- branch-name conventions beginning with `agreement/`;
- the `CLA_REGISTRY.yaml` schema;
- workflow permissions;
- managed-comment marker text.

Those values are shared across workflows, scripts, tests, or branch rules.

## Registry behavior

`CLA_REGISTRY.yaml` on each protected branch is authoritative for pull requests targeting that branch. Agreement pull requests update their intended base branch, and registry changes refresh open pull requests targeting that same branch.

Authorization uses the immutable numeric GitHub user ID. The recorded login is retained for readability and audit history, but login changes do not invalidate an agreement.
