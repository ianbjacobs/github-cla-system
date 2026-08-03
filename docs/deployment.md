# Deployment guide

## Required secrets

- `APP_ID`: numeric GitHub App ID
- `WEBHOOK_SECRET`: a high-entropy webhook secret
- GitHub App private key mounted as a file referenced by `PRIVATE_KEY_PATH`

Never commit `.env` or a private key. Rotate the webhook secret and private key according to your organization's security policy.

## Container

```bash
docker build -t github-cla-system:0.6.0-alpha.1 .
docker run --rm -p 3000:3000 \
  --env-file .env \
  --mount type=bind,src="$PWD/private-key.pem",dst=/run/secrets/github-app.pem,readonly \
  -e PRIVATE_KEY_PATH=/run/secrets/github-app.pem \
  github-cla-system:0.6.0-alpha.1
```

Configure the platform to use:

- liveness: `GET /health/live`
- readiness: `GET /health/ready`
- webhook: `POST /webhooks/github`

Terminate TLS at a trusted reverse proxy or managed ingress. The application should not be exposed over plaintext Internet HTTP.

## Scaling

The application is stateless except for its bounded in-process delivery cache. Multiple replicas are supported, but duplicate webhook deliveries may reach different replicas. GitHub-side operations and generated branch naming remain the final idempotency boundary.
