# Design

GitHub CLA System is an experimental GitHub App that keeps contributor
agreement policy and records in the repository.

## Core decisions

- The application is framework-independent and does not depend on Probot.
- `AGREEMENTS.yaml` is the authoritative registry.
- Contributors accept an agreement through a GitHub issue.
- Each acceptance is proposed through a maintainer-reviewed pull request.
- No external database or signing service is required.
- The legal terms are repository-owned and intentionally absent from the
  default template.
- Agreement records identify both a human-readable version and a SHA-256
  fingerprint of the exact agreement text.

The project is experimental and must be reviewed before production use.

## Milestone 2: webhook boundary

Raw webhook JSON is treated as untrusted input. Event-specific Zod schemas validate
supported payloads before application handlers receive them. The dispatcher exposes
explicit `handled`, `ignored`, and `invalid` outcomes, and accepts injected handlers so
routing can be tested without network calls.
