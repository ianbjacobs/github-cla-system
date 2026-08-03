# GitHub CLA System

> **Experimental software**
>
> GitHub CLA System is under active development and remains a prerelease. It now includes
> production-oriented runtime controls, but must still be validated against your deployment environment. Review its behavior, security assumptions, and legal workflow
> before deployment. The included CLA has no legal terms and must be completed.

A framework-independent GitHub App that collects and enforces contributor agreements entirely in GitHub.

## Workflow

1. A contributor selects **Sign Contributor Agreement** and submits the repository Issue Form.
2. The app validates both required acknowledgements and uses the authenticated GitHub webhook identity.
3. The app creates a branch containing an immutable record under `agreements/` and an updated `AGREEMENTS.yaml`.
4. The app opens a pull request labeled `agreement` and closes the source issue with a link to it.
5. A maintainer verifies the issue and merges the Agreement PR.
6. Contribution pull requests pass only when the author's numeric GitHub user ID has a current, repository-scoped entry in `AGREEMENTS.yaml`.
7. Checks are re-evaluated when contribution PRs open, reopen, or synchronize; when an Agreement PR merges; and when the default branch changes.

Generated Agreement PRs are excluded from CLA enforcement to avoid a circular dependency.

## Requirements

- Node.js 22.x
- A GitHub App private key
- GitHub App permissions: Checks, Contents, Issues, and Pull requests (read/write); Metadata (read)
- Webhook events: Issues, Pull request, and Push

## Local setup

```bash
cp .env.example .env
npm install
npm run dev
```

Set the GitHub App webhook URL to `https://your-host.example/webhooks/github` and use the same webhook secret in GitHub and `WEBHOOK_SECRET`.

## Build and test

```bash
npm run format  # writes formatting and safe import fixes
npm run check   # read-only validation, type checking, and tests
npm run build
npm start
```

## Operations

The service exposes `/health/live`, `/health/ready`, and an optional `/metrics` endpoint.
It emits structured JSON logs, requires GitHub delivery IDs, deduplicates successful deliveries
within a bounded process-local cache, and drains HTTP connections during shutdown. See
[the deployment guide](docs/deployment.md) and [Milestone 6](docs/milestone-6.md).

## Configuration

Repository settings live in `.github/cla/config.yml`. Replace `.github/cla/agreement.md` and the Issue Form placeholder with legally reviewed, identical agreement text before production use.

## Security model

Webhook payloads are validated with HMAC-SHA256 using `X-Hub-Signature-256`. API calls use short-lived GitHub App installation access tokens. The numeric GitHub user ID is authoritative; logins are retained only for readability.

## Container deployment

```bash
docker build -t github-cla-system:0.6.0-alpha.1 .
docker compose up --build
```

Mount the GitHub App private key read-only and terminate TLS before traffic reaches the app.

## License

W3C Software Notice and License. See `LICENSE`.

## Organization-wide policies

Set `agreementScope: organization` and `policyRepository: owner/repository` in `.github/cla/config.yml` to keep the canonical agreement and registry in a shared repository. See [the configuration reference](docs/configuration.md).

Agreement versions are exact: changing `agreementVersion` requires contributors to accept the new version.
