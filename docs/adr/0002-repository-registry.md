# ADR 0002: Repository-local agreement registry

## Status

Accepted.

## Decision

`AGREEMENTS.yaml` is the authoritative agreement registry. Registry changes are
reviewed and merged like source changes, providing an auditable Git history
without an external database.
