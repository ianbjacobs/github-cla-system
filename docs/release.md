# Release process

## Release candidate validation

Run on Node.js 22:

```bash
npm install
npm run format
npm run check
npm run build
docker build --tag github-cla-system:release-candidate .
```

Then perform the smoke test in [`installation.md`](installation.md) against a disposable repository.
Review permissions, webhook events, configuration, legal agreement text, branch protection, logs,
and recovery procedures.

## Creating a release

1. Update `CHANGELOG.md` and the package version.
2. Commit with a clean working tree.
3. Tag the validated commit, for example:

   ```bash
   git tag v1.0.0-rc.1
   git push origin v1.0.0-rc.1
   ```

4. The Release workflow validates and builds the project, creates source archives and SHA-256
   checksums, and publishes a GitHub prerelease for tags containing a hyphen.

## Promoting to v1.0.0

Promote only after the release candidate has completed a real GitHub lifecycle test and no
release-blocking defects remain. Change the package version to `1.0.0`, update the changelog, repeat
all validation, and tag `v1.0.0`.
