# Milestone 7: v1.0.0 release candidate

Milestone 7 completes the planned implementation and prepares `v1.0.0-rc.1` for live evaluation.

## Release additions

- full application-layer lifecycle integration coverage from unsigned PR through merged Agreement PR
- GitHub App installation and smoke-test instructions
- troubleshooting, recovery, release, and project-state documentation
- tag-triggered GitHub release packaging with SHA-256 checksums
- final permission, webhook-event, persistence, and deferred-scope audit

## Validation required before v1.0.0

The automated suite does not replace a live GitHub smoke test. Before promotion, deploy the release
candidate and complete the sequence in `installation.md` using a disposable repository and test
accounts. Confirm that branch protection requires the CLA check and only maintainers can merge
generated Agreement PRs.
