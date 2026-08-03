# Changelog

## 0.4.0-alpha.1 RC3

### Fixed

- Exempt generated Agreement PRs from contribution enforcement when identified by either the `agreement` label or the generated PR metadata marker.
- Corrected the router test contract: malformed payloads for supported webhook events return `invalid`, while unsupported event names return `ignored`.

## 0.4.0-alpha.1 RC2

### Fixed

- Applied Biome formatting across Milestone 4 source and test files.
- Organized imports and exports so `npm run check` remains read-only and clean.
- No functional behavior changed from Milestone 4 RC1.

## 0.4.0-alpha.1 - Milestone 4

### Added

- CLA Check Run enforcement for opened, reopened, and synchronized contribution pull requests.
- Default-branch push handling that re-evaluates all open contribution pull requests.
- Push webhook validation and dispatch tests.
- Exemption for generated Agreement PRs, preventing circular CLA enforcement.

### Changed

- `npm run check` is now read-only; `npm run format` performs formatting and safe fixes.
- GitHub App subscriptions now include push events.
- Documentation now reflects standalone signing and current enforcement behavior.

# Changelog

## 1.0.0-alpha.2 - Unreleased

### Added

- Event-specific Zod schemas for `issues` and `pull_request` webhooks.
- A dependency-injected webhook dispatcher with explicit handled, ignored, and invalid outcomes.
- Tests for payload parsing, routing, installation IDs, and preservation of issue node IDs.
- Webhook delivery ID logging and a one-megabyte request body limit.

### Changed

- The HTTP server now returns distinct responses for invalid JSON, missing headers, invalid payloads, ignored events, and handled events.
- The legacy router module now remains as a compatibility export over the dispatcher.

## 1.0.0-alpha.1

- Establish the experimental Node.js 22 and TypeScript project foundation.
- Add GitHub App authentication and webhook verification scaffolding.
- Add repository configuration, registry, issue-form, and workflow prototypes.
- Adopt the W3C Software Notice and License.
- Fix Octokit request typing under `exactOptionalPropertyTypes`, including optional refs and check-run payloads.

## 0.3.0-alpha.1 - Milestone 3

### Fixed

- Removed the obsolete contribution-PR-number test from the standalone signing workflow.
- Expanded Issue Form tests to cover checked, unchecked, and mismatched acknowledgement labels.

### Added

- Standalone Issue Form to Agreement PR workflow.
- Immutable per-contributor agreement records under `agreements/`.
- Agreement blob SHA, GitHub user node ID, issue node ID, and GitHub issue timestamp provenance.
- Multi-file commits for agreement records and the generated registry.
- Re-evaluation of open contribution PR checks after an agreement PR merges.

### Changed

- Signing no longer requires or references a contribution pull request.
- Unsigned contribution PRs receive a failed check with instructions to use the signing Issue Form.
