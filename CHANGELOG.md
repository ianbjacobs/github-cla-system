# Changelog

## 0.3.0-alpha.2

### Fixed

- Corrected the enforcement test registry fixture so `signedAt` remains a YAML string, matching generated `AGREEMENTS.yaml` records.

## 0.2.0-alpha.1 — A2 RC1

### Added

- Automatic `issues.opened` workflow for signing requests.
- Trusted event-payload parsing for contributor numeric ID, user node ID, issue node ID, login, and timestamp.
- Deterministic Agreement PR branch creation.
- Branch-only `AGREEMENTS.yaml` update.
- Automatically labeled Agreement PR with `Closes #<issue>`.
- Helpful handling for invalid requests and contributors who already signed the current version.
- Unit tests for agreement-request preparation.

### Changed

- Replaced the A2 manual workflow scaffold with the real issue-triggered workflow.
- Updated documentation for the Actions-only token and merge model.

## 0.1.0-alpha.2 — A1 RC2

- Migrated Biome recommended rules to the current `preset` syntax.

## 0.1.0-alpha.1 — A1 RC1

- Established the clean Actions-only project baseline.
