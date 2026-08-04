# Security policy

This project is experimental. Do not rely on it for legally significant acceptances without independent legal, security, privacy, and operational review.

Report suspected vulnerabilities privately to the repository maintainers. Do not include secrets or personal data in public issues.

## Security boundaries

- The pull-request check uses `pull_request_target`, but checks out and executes only code from the trusted default branch.
- The workflow must never check out or execute contributor-controlled PR code.
- Authorization uses the contributor's immutable numeric GitHub user ID; logins are retained only for readability and audit history.
- Generated agreement PRs are exempt only when their branch is in the base repository and starts with `agreement/`.
- Workflow permissions are declared explicitly and should not be broadened without review.
- `CLA_REGISTRY.yaml` changes become authoritative only after merge to the default branch.
