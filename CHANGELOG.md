# Changelog

## 1.0.0-rc.1 — A4 RC1

### Added

- Automatic re-evaluation of open pull requests whenever `AGREEMENTS.yaml` changes on the default branch.
- Shared `Contributor Agreement` commit-status mapping for initial PR checks and refreshes.
- Status-description length normalization.
- Tag-triggered source release workflow with a SHA-256 checksum.
- Final Actions-only architecture, setup, security, and operations documentation.
- Unit tests for status mapping and open-PR refresh behavior.

### Changed

- The pull-request enforcement workflow now publishes an explicit required commit status.
- Documentation recognizes `actions-only` as this repository's current default branch while keeping workflows portable.

## 0.3.0-alpha.2 — A3 RC2

### Fixed

- Corrected the enforcement test registry fixture so `signedAt` remains a YAML string, matching generated `AGREEMENTS.yaml` records.

## 0.3.0-alpha.1 — A3 RC1

### Added

- Trusted pull-request contributor-agreement enforcement.
- Current agreement-version lookup by immutable numeric GitHub user ID.
- Safe generated Agreement PR exemption with fork-imitation protection.

## 0.2.0-alpha.1 — A2 RC1

### Added

- Automatic `issues.opened` workflow for signing requests.
- Trusted event-payload parsing for contributor numeric ID, user node ID, issue node ID, login, and timestamp.
- Deterministic Agreement PR branch creation.
- Branch-only `AGREEMENTS.yaml` update.
- Automatically labeled Agreement PR with `Closes #<issue>`.
- Helpful handling for invalid requests and contributors who already signed the current version.
- Unit tests for agreement-request preparation.

## 0.1.0-alpha.2 — A1 RC2

- Migrated Biome recommended rules to the current `preset` syntax.

## 0.1.0-alpha.1 — A1 RC1

- Established the clean Actions-only project baseline.
