# Webhook processing

The application accepts GitHub webhooks at `POST /webhooks/github`.

Processing order:

1. Enforce the one-megabyte request limit.
2. Verify `X-Hub-Signature-256` against the raw body.
3. Parse JSON.
4. Require `X-GitHub-Event` and an installation ID.
5. Validate supported events with event-specific Zod schemas.
6. Dispatch the typed payload to the relevant application handler.
7. Log the delivery ID, event, installation ID, and result.

Outcomes:

- `handled`: a supported event was dispatched.
- `ignored`: the event or object does not require action.
- `invalid`: the event name is supported, but its payload shape is invalid.

Supported event actions:

- `pull_request`: `opened`, `reopened`, `synchronize`, `closed`
- `issues`: `opened`, `edited`, `reopened`
