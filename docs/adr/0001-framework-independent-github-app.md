# ADR 0001: Framework-independent GitHub App

## Status

Accepted.

## Decision

The application uses Node.js, Octokit, and a small HTTP webhook adapter without
Probot. This keeps webhook transport separate from application logic and avoids
making a framework the architectural center of the project.
