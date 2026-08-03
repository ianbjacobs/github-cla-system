# Milestone 3: Agreement request workflow

Milestone 3 implements the standalone signing flow initiated by the repository's **Sign Contributor Agreement** Issue Form.

## Flow

1. GitHub delivers an `issues.opened` webhook.
2. The app validates both required checkboxes.
3. The app takes identity only from the authenticated webhook sender.
4. The app records the numeric user ID, user node ID, login, issue number, issue node ID, issue creation time, agreement path, agreement version, and agreement blob SHA.
5. A deterministic branch is created.
6. The branch receives an immutable `agreements/<github-id>/<version>.yaml` record and a regenerated `AGREEMENTS.yaml` index.
7. The app opens a PR labeled `agreement` and closes the signing issue with a link to that PR.
8. A maintainer verifies the source issue and merges the PR.

The app never treats an unmerged branch or open PR as an effective agreement.
