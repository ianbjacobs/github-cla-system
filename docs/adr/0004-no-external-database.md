# ADR 0004: No external database

## Status

Accepted.

## Decision

The system stores no authoritative agreement state outside the repository. This
reduces operational complexity and makes Git history the audit log.
