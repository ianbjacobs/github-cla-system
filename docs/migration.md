# Migrating the actions-only branch to A1

The A1 ZIP overwrites and adds files, but ZIP extraction cannot delete files from the hosted GitHub
App implementation.

After extracting A1 over the `actions-only` branch checkout, run:

```bash
./migration/clean-full-github-app.sh
git status
npm install
npm run format
npm run check
```

Review every deletion before committing. The full GitHub App remains available on its preserved tag
and in the milestone ZIP archives.
