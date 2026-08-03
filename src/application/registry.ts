import yaml from "js-yaml";
import { z } from "zod";
import type { AgreementEntry, AgreementRegistry } from "../domain/types.js";
import { normalizeLogin, positiveInteger, repositoryName } from "../domain/validation.js";

const entrySchema = z
  .object({
    githubId: z.number().int().positive(),
    githubNodeId: z.string().min(1),
    githubLogin: z.string().min(1),
    agreementVersion: z.string().min(1),
    agreementPath: z.string().min(1),
    agreementCommit: z.string().min(7),
    signedAt: z.string().datetime(),
    repository: z.string().min(3),
    scope: z.enum(["repository", "organization"]).default("repository"),
    scopeOwner: z.string().min(1).optional(),
    issueNumber: z.number().int().positive(),
    issueNodeId: z.string().min(1),
    recordPath: z.string().min(1),
  })
  .strict();
const registrySchema = z
  .object({ schemaVersion: z.literal(1), agreements: z.array(entrySchema) })
  .strict();

export function parseRegistry(source: string | null): AgreementRegistry {
  if (!source) return { schemaVersion: 1, agreements: [] };
  const parsed = registrySchema.parse(yaml.load(source));
  const normalized: AgreementRegistry = {
    schemaVersion: 1,
    agreements: parsed.agreements.map((entry) => {
      const [owner] = entry.repository.split("/");
      if (!owner) throw new Error(`Invalid agreement repository: ${entry.repository}`);
      return { ...entry, scopeOwner: entry.scopeOwner ?? owner.toLowerCase() };
    }),
  };
  const keys = new Set<string>();
  for (const entry of normalized.agreements) {
    const key = `${entry.githubId}:${entry.agreementVersion}:${entry.scope}:${entry.scopeOwner.toLowerCase()}:${entry.repository.toLowerCase()}`;
    if (keys.has(key)) throw new Error(`Duplicate agreement: ${key}`);
    keys.add(key);
  }
  return normalized;
}

export function serializeRegistry(registry: AgreementRegistry): string {
  const normalized = {
    schemaVersion: 1 as const,
    agreements: [...registry.agreements].sort(
      (a, b) =>
        a.githubId - b.githubId ||
        a.agreementVersion.localeCompare(b.agreementVersion) ||
        a.scope.localeCompare(b.scope) ||
        a.scopeOwner.localeCompare(b.scopeOwner) ||
        a.repository.localeCompare(b.repository),
    ),
  };
  return yaml.dump(normalized, { noRefs: true, lineWidth: 100, noCompatMode: true });
}

export function serializeAgreementRecord(entry: AgreementEntry): string {
  return yaml.dump(
    { schemaVersion: 1, ...entry },
    { noRefs: true, lineWidth: 100, noCompatMode: true },
  );
}

export function findAgreement(
  registry: AgreementRegistry,
  githubId: number,
  version: string,
  repository: string,
): AgreementEntry | undefined {
  const [owner] = repository.toLowerCase().split("/");
  return registry.agreements.find(
    (entry) =>
      entry.githubId === githubId &&
      entry.agreementVersion === version &&
      (entry.scope === "organization"
        ? entry.scopeOwner.toLowerCase() === owner
        : entry.repository.toLowerCase() === repository.toLowerCase()),
  );
}

export function addAgreement(
  registry: AgreementRegistry,
  entry: AgreementEntry,
): AgreementRegistry {
  const [owner, repo] = entry.repository.split("/");
  if (!owner || !repo) throw new Error("Invalid repository scope.");
  const normalized: AgreementEntry = {
    ...entry,
    githubId: positiveInteger(entry.githubId, "githubId"),
    githubLogin: normalizeLogin(entry.githubLogin),
    repository: repositoryName(owner, repo),
    scopeOwner: normalizeLogin(entry.scopeOwner),
  };
  const existing = registry.agreements.find(
    (candidate) =>
      candidate.githubId === normalized.githubId &&
      candidate.agreementVersion === normalized.agreementVersion &&
      candidate.scope === normalized.scope &&
      candidate.scopeOwner.toLowerCase() === normalized.scopeOwner.toLowerCase() &&
      candidate.repository.toLowerCase() === normalized.repository.toLowerCase(),
  );
  if (existing) {
    if (JSON.stringify(existing) === JSON.stringify(normalized)) return registry;
    throw new Error("A conflicting agreement already exists for this user and version.");
  }
  return { schemaVersion: 1, agreements: [...registry.agreements, normalized] };
}
