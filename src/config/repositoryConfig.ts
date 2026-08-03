import yaml from "js-yaml";
import { z } from "zod";
import type { ClaConfig } from "../domain/types.js";
import { safePath } from "../domain/validation.js";

export const CONFIG_PATH = ".github/cla/config.yml";
export const DEFAULT_CONFIG: ClaConfig = {
  agreementVersion: "1.0",
  agreementTemplatePath: ".github/cla/agreement.md",
  agreementRegistryPath: "AGREEMENTS.yaml",
  agreementRecordsDirectory: "agreements",
  statusCheckName: "Contributor License Agreement",
  labels: { agreement: "agreement", pending: "pending-cla" },
};

const schema = z
  .object({
    agreementVersion: z.string().min(1).default(DEFAULT_CONFIG.agreementVersion),
    agreementTemplatePath: z.string().min(1).default(DEFAULT_CONFIG.agreementTemplatePath),
    agreementRegistryPath: z.string().min(1).default(DEFAULT_CONFIG.agreementRegistryPath),
    agreementRecordsDirectory: z.string().min(1).default(DEFAULT_CONFIG.agreementRecordsDirectory),
    statusCheckName: z.string().min(1).default(DEFAULT_CONFIG.statusCheckName),
    labels: z
      .object({
        agreement: z.string().min(1).max(50).default(DEFAULT_CONFIG.labels.agreement),
        pending: z.string().min(1).max(50).default(DEFAULT_CONFIG.labels.pending),
      })
      .default(DEFAULT_CONFIG.labels),
  })
  .strict();

export function parseRepositoryConfig(source: string | null): ClaConfig {
  const parsed = source ? yaml.load(source) : {};
  const config = schema.parse(parsed ?? {});
  if (config.labels.agreement === config.labels.pending) throw new Error("CLA labels must differ.");
  return {
    ...config,
    agreementTemplatePath: safePath(config.agreementTemplatePath),
    agreementRegistryPath: safePath(config.agreementRegistryPath),
    agreementRecordsDirectory: safePath(config.agreementRecordsDirectory),
  };
}
