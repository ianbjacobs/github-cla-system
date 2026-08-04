# A GitHub-based tool to collect contributor agreements.

A repository-local, GitHub Actions-only system for collecting and enforcing contributor agreements. It requires no GitHub App, webhook server, external database, private key, or long-running service.

**This project is experimental.** Obtain independent legal, security, privacy, and operational review before relying on it for legally significant agreements.

## How it works

1. An unsigned contributor opens a pull request.
2. The `Contributor Agreement` workflow checks the author's immutable numeric GitHub ID against `CLA_REGISTRY.yaml`.
3. If no current agreement exists, the required status fails and a managed PR comment links to the **Sign Contributor Agreement** Issue Form.
4. The contributor submits the form with both acknowledgements checked.
5. The `Create Agreement PR` workflow creates an `agreement/<github-id>/issue-<number>` branch, updates `CLA_REGISTRY.yaml`, and opens an `agreement` pull request.
6. A maintainer reviews and merges that agreement PR.
7. The `Refresh Contributor Agreements` workflow re-evaluates open pull requests, turns the original status green, and removes the signing comment.

Only `CLA_REGISTRY.yaml` on the default branch is authoritative. A signing issue is the contributor's attestation; the generated agreement PR is a proposal; the maintainer merge is the repository's acceptance of that record.

## To use this tool in your repository

1. Replace the placeholder terms in `agreement/CONTRIBUTOR_AGREEMENT.md`.
2. Put the same approved terms in `.github/ISSUE_TEMPLATE/sign-contributor-agreement.yml`.
3. Ensure the repository has a `pending-agreement` label.
4. In **Settings → Actions → General → Workflow permissions**, grant read and write permissions and allow GitHub Actions to create pull requests.
5. Create a branch ruleset for the default branch that requires the exact status context `Contributor Agreement`.
6. Restrict agreement PR merges to maintainers through normal repository permissions and review policy.

The workflows resolve the repository's default branch dynamically.

## Development

Requires Node.js 22.

```bash
npm install
npm run check
```

See [docs/actions-only.md](docs/actions-only.md) for the workflow and security model, and [docs/troubleshooting.md](docs/troubleshooting.md) for operational checks.
