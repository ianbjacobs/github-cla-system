# GitHub App installation

## 1. Deploy the service

Deploy the container or Node.js process behind HTTPS. The public webhook endpoint is:

```text
https://your-host.example/webhooks/github
```

Liveness, readiness, and optional metrics endpoints are documented in
[`deployment.md`](deployment.md).

## 2. Register the GitHub App

Use `app.yml` as the permission and event reference. Replace every example URL before use.

Required repository permissions:

| Permission | Access | Purpose |
| --- | --- | --- |
| Metadata | Read | Repository identity and installation context |
| Contents | Read and write | Read configuration/agreement files and create agreement branches |
| Issues | Read and write | Read signing issues, comment, label, and close them |
| Pull requests | Read and write | Open and inspect Agreement PRs |
| Checks | Read and write | Create or update the required CLA check |

Subscribe to these events:

- Issues
- Pull request
- Push

Set the webhook secret to the same strong random value used by `WEBHOOK_SECRET`.
Download the App private key and mount it read-only at `PRIVATE_KEY_PATH`.

## 3. Install the App

Install it on each participating repository. For organization-wide policy mode, also install it
on the configured central policy repository so it can read and write the canonical registry.

## 4. Add repository files

Copy and customize:

- `.github/cla/config.yml`
- `.github/cla/agreement.md`
- `.github/ISSUE_TEMPLATE/sign-cla.yml`
- `AGREEMENTS.yaml`
- `agreements/.gitkeep`

The Issue Form and canonical agreement must contain the same legally reviewed terms. The sample
agreement is intentionally not legally complete.

## 5. Configure branch protection

After the App has created its first check, require the configured check name (default:
`Contributor License Agreement`) on the protected branch. Require maintainer review for Agreement
PRs, preferably through `CODEOWNERS` or repository rulesets.

## 6. Smoke test

1. Open an unsigned test contribution PR and confirm the CLA check fails.
2. Submit the signing Issue Form with both boxes selected.
3. Confirm the App opens a PR labeled `agreement` and closes the issue with a link.
4. Review and merge the Agreement PR.
5. Confirm the contribution PR check becomes successful.
