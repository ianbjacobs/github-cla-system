# Changelog

## 0.1.0-alpha.2 - A1 RC2

### Changed

- Migrated Biome lint configuration from the deprecated `recommended` boolean to `preset: "recommended"`.
- No functional changes to the Actions-only baseline.

## 0.1.0-alpha.1 - A1

### Added

- Clean Actions-only project baseline.
- Exact signing-issue checkbox validation.
- Versioned YAML registry parsing, serialization, lookup, and deterministic updates.
- Deterministic agreement branch naming.
- Read-only command-line validation tools.
- Manually dispatched workflow scaffolds for A2 and A3.
- Migration cleanup script and documentation.

### Removed

- Hosted HTTP runtime, webhook receiver, GitHub App authentication, metrics, health endpoints,
  delivery cache, Docker deployment, and related tests from the Actions-only architecture.
