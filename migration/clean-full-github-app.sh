#!/usr/bin/env bash
set -euo pipefail

# Run from the repository root on the actions-only branch, after extracting A1.
# The A1 implementation uses lib/ and tests/, so the old src/ and test/ trees can be removed safely.
rm -rf src test docs/decisions
rm -f Dockerfile compose.yml docker-compose.yml app.yml .env.example tsconfig.json RELEASE_NOTES.md SUPPORT.md DESIGN.md
rm -f .github/workflows/release.yml

echo "Removed files that belong only to the hosted GitHub App implementation."
echo "Review 'git status' before committing."
