# A GitHub-based tool to collect contributor agreements.

A repository-local, GitHub Actions-only system for collecting and enforcing contributor agreements. It requires no GitHub App, webhook server, external database, private key, or long-running service.

**This project is experimental.** Obtain independent legal, security, privacy, and operational review before relying on it for legally significant agreements.

## Use this tool in your repo

See the [Installation and configuration guide](docs/installation.md) and [how it works](docs/how-it-works.md).

## User journey

The user must be signed into GitHub to create a pull request. If that GitHub account has previously signed the CLA for this repo, then the pull request can be merged (by the maintainers).

If the user has not previously signed the CLA:

* A "sign here" message appears in the discussion thread of the pull request to let them know they must agree to the CLA in order for the pull request to be merged.
* The user follows a link to sign the CLA. This creates a new issue in the repo (with label 'pending-agreement').
* The creation of the issue triggers creation of a pull request to record (in CLA_REGISTRY.yaml) acceptance of the CLA by this GitHub account.
* That pull request must be merged by the repo maintainers, and approval modifies CLA_Registry.yaml.
* This merge triggers an action that closes the issue that was created, and also removes the "sign here" message from the original pull request.
* Then the maintainers can evaluate and possibly merge the original pull request, now that there is a record of the user signing the CLA.

## Development

Requires Node.js 22.

```bash
npm install
npm run check
```

See [how it works](docs/how-it-works.md) for the workflow and security model, and [docs/troubleshooting.md](docs/troubleshooting.md) for operational checks.
