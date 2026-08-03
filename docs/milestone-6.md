# Milestone 6: Production hardening

Milestone 6 hardens the service boundary and adds deployable runtime artifacts.

## Runtime behavior

- `/health/live` confirms the process can serve HTTP.
- `/health/ready` returns `503` during startup and graceful shutdown.
- `/health` remains as a backwards-compatible liveness endpoint.
- `/metrics` exposes Prometheus counters only when `ENABLE_METRICS=true`.
- Every response includes restrictive cache, content, framing, and referrer headers.
- Webhook bodies larger than `MAX_WEBHOOK_BYTES` receive `413`.
- `X-GitHub-Delivery` is required and successful deliveries are deduplicated in a bounded, process-local TTL cache.
- `SIGINT` and `SIGTERM` stop readiness, drain connections, and enforce a shutdown timeout.

## Observability

Logs are single-line JSON with timestamp, level, message, delivery ID, event, installation ID, result, and duration where applicable. Secrets, payload bodies, and installation tokens are never logged.

The in-process metrics are intentionally low-cardinality. Delivery IDs, repository names, and user identifiers are not metric labels.

## Deployment

`Dockerfile` creates a non-root Node.js 22 runtime image with an HTTP health check. `compose.yml` demonstrates mounting the private key as a read-only file. Production environments should use their platform's secret manager instead of storing the key in the repository or image.

## Delivery deduplication limitation

The delivery cache is process-local and best-effort. It protects against immediate GitHub retries handled by the same process, but does not coordinate replicas and does not survive restarts. The underlying GitHub operations must therefore remain idempotent. A shared external store is intentionally out of scope because the project retains its no-external-database architecture.
