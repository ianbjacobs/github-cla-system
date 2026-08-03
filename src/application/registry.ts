import yaml from "js-yaml";
import { z } from "zod";
import type { AgreementEntry, AgreementRegistry } from "../domain/types.js";
import { normalizeLogin, positiveInteger, repositoryName } from "../domain/validation.js";

const entrySchema = z
  .object({
    githubId: z.number().int().positive(),
    githubLogin: z.string().min(1),
    agreementVersion: z.string().min(1),
    signedAt: z.string().datetime(),
    repository: z.string().min(3),
    issueNumber: z.number().int().positive(),
    issueNodeId: z.string().min(1),
    contributionPullRequestNumber: z.number().int().positive(),
  })
  .strict();
const registrySchema = z
  .object({ schemaVersion: z.literal(1), agreements: z.array(entrySchema) })
  .strict();

export function parseRegistry(source: string | null): AgreementRegistry {
  if (!source) return { schemaVersion: 1, agreements: [] };
  const parsed = registrySchema.parse(yaml.load(source));
  const keys = new Set<string>();
  for (const entry of parsed.agreements) {
    const key = `${entry.githubId}:${entry.agreementVersion}`;
    if (keys.has(key)) throw new Error(`Duplicate agreement: ${key}`);
    keys.add(key);
  }
  return parsed;
}

export function serializeRegistry(registry: AgreementRegistry): string {
  const normalized = {
    schemaVersion: 1 as const,
    agreements: [...registry.agreements].sort(
      (a, b) => a.githubId - b.githubId || a.agreementVersion.localeCompare(b.agreementVersion),
    ),
  };
  return yaml.dump(normalized, { noRefs: true, lineWidth: 100, noCompatMode: true });
}

export function findAgreement(
  registry: AgreementRegistry,
  githubId: number,
  version: string,
  repository: string,
): AgreementEntry | undefined {
  return registry.agreements.find(
    (entry) =>
      entry.githubId === githubId &&
      entry.agreementVersion === version &&
      entry.repository.toLowerCase() === repository.toLowerCase(),
  );
}

export function addAgreement(
  registry: AgreementRegistry,
  entry: AgreementEntry,
): AgreementRegistry {
  const normalized: AgreementEntry = {
    ...entry,
    githubId: positiveInteger(entry.githubId, "githubId"),
    githubLogin: normalizeLogin(entry.githubLogin),
    repository: (() => {
      const [owner, repo] = entry.repository.split("/");
      if (!owner || !repo) throw new Error("Invalid repository scope.");
      return repositoryName(owner, repo);
    })(),
  };
  const existing = registry.agreements.find(
    (item) =>
      item.githubId === normalized.githubId &&
      item.agreementVersion === normalized.agreementVersion,
  );
  if (existing) {
    if (JSON.stringify(existing) === JSON.stringify(normalized)) return registry;
    throw new Error("A conflicting agreement already exists for this user and version.");
  }
  return { schemaVersion: 1, agreements: [...registry.agreements, normalized] };
}
