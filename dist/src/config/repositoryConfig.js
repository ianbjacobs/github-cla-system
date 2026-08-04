import yaml from "js-yaml";
import { z } from "zod";
import { safePath } from "../domain/validation.js";
export const CONFIG_PATH = ".github/cla/config.yml";
export const DEFAULT_CONFIG = {
  schemaVersion: 1,
  agreementVersion: "1.0",
  agreementTemplatePath: ".github/cla/agreement.md",
  agreementRegistryPath: "AGREEMENTS.yaml",
  agreementRecordsDirectory: "agreements",
  agreementScope: "repository",
  statusCheckName: "Contributor License Agreement",
  labels: { agreement: "agreement", pending: "pending-cla" },
};
const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const schema = z
  .object({
    schemaVersion: z.literal(1).default(1),
    agreementVersion: z.string().min(1).default(DEFAULT_CONFIG.agreementVersion),
    agreementTemplatePath: z.string().min(1).default(DEFAULT_CONFIG.agreementTemplatePath),
    agreementRegistryPath: z.string().min(1).default(DEFAULT_CONFIG.agreementRegistryPath),
    agreementRecordsDirectory: z.string().min(1).default(DEFAULT_CONFIG.agreementRecordsDirectory),
    agreementScope: z.enum(["repository", "organization"]).default(DEFAULT_CONFIG.agreementScope),
    policyRepository: z.string().regex(repositoryPattern).optional(),
    statusCheckName: z.string().min(1).default(DEFAULT_CONFIG.statusCheckName),
    labels: z
      .object({
        agreement: z.string().min(1).max(50).default(DEFAULT_CONFIG.labels.agreement),
        pending: z.string().min(1).max(50).default(DEFAULT_CONFIG.labels.pending),
      })
      .default(DEFAULT_CONFIG.labels),
  })
  .strict();
function repositoryRef(value) {
  if (!value) return undefined;
  const [owner, repo] = value.split("/");
  if (!owner || !repo) throw new Error("policyRepository must use owner/repository syntax.");
  return { owner, repo };
}
export function parseRepositoryConfig(source) {
  const parsed = source ? yaml.load(source) : {};
  const config = schema.parse(parsed ?? {});
  if (config.labels.agreement === config.labels.pending) throw new Error("CLA labels must differ.");
  if (config.agreementScope === "organization" && !config.policyRepository) {
    throw new Error("Organization-scoped agreements require policyRepository.");
  }
  const policyRepository = repositoryRef(config.policyRepository);
  return {
    schemaVersion: config.schemaVersion,
    agreementVersion: config.agreementVersion,
    agreementTemplatePath: safePath(config.agreementTemplatePath),
    agreementRegistryPath: safePath(config.agreementRegistryPath),
    agreementRecordsDirectory: safePath(config.agreementRecordsDirectory),
    agreementScope: config.agreementScope,
    ...(policyRepository ? { policyRepository } : {}),
    statusCheckName: config.statusCheckName,
    labels: config.labels,
  };
}
