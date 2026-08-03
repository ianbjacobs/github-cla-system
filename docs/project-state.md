# Project state: v1.0.0-rc.1

## Implemented

- GitHub Issue Form attestation with two required acknowledgements
- immutable identity and issue provenance, including numeric user ID and issue node ID
- generated Agreement branches and maintainer-reviewed pull requests
- repository and organization-wide registries
- exact agreement-version enforcement through GitHub Checks
- typed webhook validation and dispatch
- structured logs, health/readiness endpoints, optional metrics, payload limits, delivery
  deduplication, and graceful shutdown
- container deployment, CI, release automation, and lifecycle integration coverage

## Persistence

Git and GitHub are authoritative. The runtime has no database. Only the bounded webhook delivery
cache is process-local and disposable.

## Deliberately deferred

- corporate contributor agreements
- a registry rebuild CLI
- multi-instance shared delivery deduplication
- GitHub Enterprise Server compatibility certification
- an Actions-only deployment mode
- integration adapters for external repository-management systems

## Release gate

The release candidate is complete only after local checks, production build, container build, and a
live disposable-repository smoke test pass.
