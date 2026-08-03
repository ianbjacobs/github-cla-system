# GitHub CLA System v1.0.0-rc.1

This release candidate completes the planned standalone GitHub App implementation.

## Included

- GitHub-native signing through an Issue Form
- immutable agreement records containing GitHub numeric user ID, user node ID, issue node ID,
  agreement version, and agreement blob SHA
- maintainer-reviewed generated Agreement PRs
- repository and organization-wide policy modes
- required GitHub Check enforcement and automatic re-evaluation
- hardened webhook runtime, structured logs, health/readiness endpoints, optional Prometheus metrics,
  payload limits, delivery deduplication, and graceful shutdown
- Docker deployment, CI, tag-driven release packaging, and lifecycle integration coverage

## Required before production

- replace all sample agreement text with legally approved terms;
- perform independent security, privacy, operational, and legal review;
- complete the live disposable-repository smoke test in `docs/installation.md`;
- configure branch protection or rulesets to require the CLA check and maintainer review;
- verify backup, monitoring, credential rotation, and incident-response procedures.

## Known release-candidate limitations

See `docs/project-state.md` for deliberately deferred capabilities. In particular, delivery
deduplication is process-local, corporate CLAs are not implemented, and no automated registry
rebuild command is included.
