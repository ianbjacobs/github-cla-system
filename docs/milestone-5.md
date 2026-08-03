# Milestone 5: Configurable and organization-wide policies

Milestone 5 introduces a versioned repository configuration model and optional centralized agreement storage.

## Configuration

Each participating repository keeps `.github/cla/config.yml`. `schemaVersion: 1` is required for explicit configurations. Existing configurations without the field remain compatible through the default.

`agreementScope` controls authorization:

- `repository`: an agreement authorizes contributions only to the repository recorded in the agreement.
- `organization`: an agreement authorizes contributions to repositories owned by `scopeOwner`.

Organization scope requires `policyRepository` in `owner/repository` form. The canonical agreement, immutable records, generated registry, branches, and Agreement PRs are read from or written to that central repository. The original signing issue is still commented on and closed in the repository where the contributor submitted it.

## Version upgrades

Authorization always requires an exact match with `agreementVersion`. Changing the configured version therefore causes existing contributors to fail the CLA check until they accept the new version. Older immutable records remain in Git history and the registry.

## Operational limitation

A push to a central policy repository cannot enumerate every consuming repository using only the current webhook. Consuming repositories re-evaluate checks when their own pull requests are opened, reopened, or synchronized. Cross-repository proactive refresh is deferred to the production integration milestone.
