# Experimental specification

## Status

This specification describes the intended v1 workflow. The implementation is
a release candidate and still requires live deployment, security, operational, and legal validation before production use.

## Contribution workflow

1. A contributor opens a pull request.
2. The app checks the contributor's immutable GitHub user ID in
   `AGREEMENTS.yaml` for the configured version and agreement hash.
3. A matching record passes the CLA check.
4. Otherwise, the app creates or reuses a signing issue.
5. The contributor accepts through the required issue checkboxes.
6. The app validates the issue author and contribution pull request author.
7. The app opens a pull request that adds the record to `AGREEMENTS.yaml`.
8. The contribution check remains pending until a maintainer merges the
   agreement pull request.
9. After merge, the app validates the merged record and passes the contribution
   check.

## Repository-owned inputs

- `.github/cla/config.yml`
- `.github/cla/agreement.md`
- `.github/ISSUE_TEMPLATE/sign-cla.yml`
- `AGREEMENTS.yaml`

The application must reject signatures while the agreement terms remain a
placeholder.
