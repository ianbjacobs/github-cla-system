# CLA configuration reference

The application reads `.github/cla/config.yml` from every participating repository.

```yaml
schemaVersion: 1
agreementVersion: "1.0"
agreementTemplatePath: ".github/cla/agreement.md"
agreementRegistryPath: "AGREEMENTS.yaml"
agreementRecordsDirectory: "agreements"
agreementScope: repository
statusCheckName: "Contributor License Agreement"
labels:
  agreement: agreement
  pending: pending-cla
```

## Organization-wide policy

A repository can use a shared agreement repository:

```yaml
schemaVersion: 1
agreementVersion: "2.0"
agreementScope: organization
policyRepository: example/contributor-agreements
```

The GitHub App must be installed with access to both the consuming repository and the policy repository. The agreement file, registry, per-contributor records, branches, and generated Agreement PRs live in the policy repository. Signing issues and contribution checks remain in the consuming repository.

Organization records authorize the same numeric GitHub user ID across repositories owned by the configured organization. They do not authorize repositories owned by another account.

## Agreement versions

The configured `agreementVersion` is matched exactly. Increasing it requires contributors to accept the new agreement version. Previous records are retained for auditability but do not satisfy checks for the new version.
