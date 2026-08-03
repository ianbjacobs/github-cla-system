# GitHub CLA System

> **Experimental software**
>
> GitHub CLA System is under active development and has not been validated for
> production use. Review its behavior, security assumptions, and legal workflow
> before deployment. The included CLA has no legal terms and must be completed.

A framework-independent GitHub App that keeps contributor agreement collection and enforcement entirely in GitHub.

## Workflow

1. A contribution pull request is opened.
2. The app checks the author's immutable GitHub numeric user ID in `AGREEMENTS.yaml`.
3. If no current agreement exists, the app creates or reuses a signing issue and leaves the CLA Check Run pending.
4. The contributor checks both required boxes using the same authenticated account that opened the contribution PR.
5. The app creates a dedicated branch, updates `AGREEMENTS.yaml`, opens a PR, labels it `agreement`, comments on the signing issue, and closes the issue.
6. A maintainer verifies the issue and merges the Agreement PR.
7. The app validates the merged registry entry and marks the original contribution PR's CLA check successful.

## Requirements

- Node.js 22.x
- A GitHub App private key
- GitHub App permissions: Checks, Contents, Issues, and Pull requests (read/write); Metadata (read)
- Webhook events: Issues and Pull request

## Local setup

```bash
cp .env.example .env
npm install
npm run dev
```

Set the GitHub App webhook URL to:

```text
https://your-host.example/webhooks/github
```

Set the same webhook secret in GitHub and `WEBHOOK_SECRET`.

## Build and test

```bash
npm run check
npm run build
npm start
```

## Configuration

Repository settings live in `.github/cla/config.yml`. The sample agreement is development scaffolding, not legal advice; replace it with legally reviewed text before production.

## Security model

Webhook payloads are validated with HMAC-SHA256 using `X-Hub-Signature-256`. API calls use short-lived GitHub App installation access tokens. The numeric GitHub user ID is authoritative; logins are retained only for readability.

## License

W3C Software Notice and License. See `LICENSE`.
