# Milestone 2: Webhook Boundary

Milestone 2 introduces a strict webhook boundary between GitHub and the application layer.

Supported events:

- `issues.opened`
- `issues.edited`
- `issues.reopened`
- `pull_request.opened`
- `pull_request.reopened`
- `pull_request.synchronize`
- `pull_request.closed`

Unknown events are acknowledged with HTTP 204 and do not create an installation client operation beyond envelope validation. Malformed supported events are also ignored by the router, while missing installation metadata is treated as a bad webhook payload by the server.

The router accepts injected handlers in tests, allowing dispatch behavior to be verified without GitHub API calls.
