# Troubleshooting and recovery

## Webhook delivery is rejected

- `401`: verify `WEBHOOK_SECRET` and GitHub's `X-Hub-Signature-256` header.
- `400`: confirm `X-GitHub-Event`, `X-GitHub-Delivery`, and a valid JSON body are present.
- `413`: increase `MAX_WEBHOOK_BYTES` only after confirming the delivery is legitimate.
- Duplicate deliveries are acknowledged without processing while their delivery ID remains in the
  process-local cache.

Use GitHub's App webhook delivery view to inspect and redeliver failed events. A redelivery with the
same delivery ID may require waiting for the cache TTL or restarting the process after determining
that the original processing did not complete successfully.

## Agreement PR is not created

Check that:

- both exact Issue Form acknowledgement labels are checked;
- `.github/cla/config.yml` is valid;
- the canonical agreement file exists;
- the App has Contents, Issues, and Pull requests write permissions;
- organization mode points to a repository where the App is installed.

The source issue remains open when validation fails and receives an explanatory comment.

## CLA check does not update

Confirm that:

- the contribution PR author has a numeric ID in the authoritative `AGREEMENTS.yaml`;
- the stored agreement version exactly matches `agreementVersion`;
- the Agreement PR was merged rather than merely closed;
- the PR carries the configured agreement label and untouched metadata marker;
- the App receives Pull request and Push events.

Synchronizing the contribution PR or pushing to the default branch triggers another evaluation.

## Recovering state

The application has no external database. Authoritative state consists of:

- the canonical agreement file and its Git blob SHA;
- immutable records under `agreements/`;
- `AGREEMENTS.yaml`;
- GitHub issues, Agreement PRs, and Git history.

Back up the Git repository normally. The delivery-deduplication cache is disposable process state
and does not need backup.

## Rebuilding a damaged registry

Do not edit authorization entries without review. Reconstruct `AGREEMENTS.yaml` from the immutable
record files in a normal pull request, compare every entry to its source issue and agreement version,
and merge only after maintainer validation. An automated rebuild command is not included in v1.0.
