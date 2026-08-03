# ADR 0005: Use bounded process-local delivery deduplication

## Status

Accepted for Milestone 6.

## Context

GitHub may retry webhook deliveries. Repeating a successfully handled delivery can create duplicate side effects. A durable shared deduplication store would conflict with the project's no-external-database architecture and would add operational requirements.

## Decision

Require `X-GitHub-Delivery` and retain successfully handled delivery IDs in a bounded, expiring, process-local cache. Invalid and failed deliveries are not cached so GitHub retries can be processed after correction or transient recovery.

## Consequences

Immediate retries reaching the same process are ignored. Restarts and multiple replicas can still process the same delivery, so GitHub API operations must remain idempotent. This limitation is documented and observable through the duplicate webhook metric.
