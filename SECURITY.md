# Security policy

GitHub CLA System is experimental. Do not use it to collect legally significant
acceptances without an independent security and legal review.

Please report suspected vulnerabilities privately to the repository
maintainers. Do not include secrets, private keys, webhook secrets, or personal
data in public issues.

## Production runtime guidance

- Terminate TLS at a trusted ingress and expose only the webhook and health endpoints required by the platform.
- Mount the GitHub App private key read-only from a secret manager; never bake it into a container image.
- Keep `/metrics` disabled unless the deployment network restricts access to authorized monitoring systems.
- Treat the in-process webhook delivery cache as best-effort only. Multiple replicas must still tolerate duplicate GitHub deliveries.
- Monitor structured error logs and the `github_cla_webhooks_total` error outcome.
