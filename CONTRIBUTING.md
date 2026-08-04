# Contributing

This project currently supports only the repository-local Actions-only architecture.

Before submitting a change:

1. Use Node.js 22.
2. Run `npm run check`.
3. Add or update tests for behavior changes.
4. Do not introduce a hosted service, webhook server, database, or GitHub App as part of unrelated work.
5. Keep `pull_request_target` workflows limited to trusted default-branch code.
