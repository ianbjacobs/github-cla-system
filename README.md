# GitHub CLA Actions

An Actions-only foundation for collecting and enforcing contributor agreements without operating a
webhook server.

## A1 status

A1 extracts and tests the reusable agreement logic. The two workflow files are deliberately manual
scaffolds:

- A2 will activate automatic Agreement PR creation from an opened signing issue.
- A3 will activate contribution-PR enforcement against the trusted default-branch registry.

A1 does **not** change `AGREEMENTS.yaml` automatically and is safe to install while the later
workflows are being developed.

## Trust model

- Issue submission is the contributor's attestation.
- A generated Agreement PR is a proposed registry change.
- Only merging that PR changes `AGREEMENTS.yaml` on the default branch.
- Only a default-branch registry entry authorizes future contributions.
- Numeric GitHub user IDs are canonical; logins are informational.

## Validate A1

```bash
npm install
npm run format
npm run check
```

The manual workflow scaffolds can also be run from the Actions tab.

## Migration from the hosted GitHub App branch

See [`docs/migration.md`](docs/migration.md). Preserve the full GitHub App tag and milestone ZIPs
before removing obsolete server files from the `actions-only` branch.

## Before use

Replace the placeholder agreement text in both:

- `agreement/CONTRIBUTOR_AGREEMENT.md`
- `.github/ISSUE_TEMPLATE/sign-contributor-agreement.yml`

Have the final terms and electronic-acceptance process reviewed by appropriate legal counsel.
