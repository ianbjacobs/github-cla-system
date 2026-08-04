import { readFile } from "node:fs/promises";
import { evaluateContributorAgreement } from "../lib/enforcement.js";

function parseLabels(source) {
  if (!source) return [];
  try {
    const parsed = JSON.parse(source);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return source
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }
}

const idText = process.env.CONTRIBUTOR_GITHUB_ID ?? process.argv[2];
if (!idText || !/^\d+$/.test(idText)) {
  console.error("Set CONTRIBUTOR_GITHUB_ID or pass a numeric GitHub ID.");
  process.exit(2);
}

const registryPath = process.env.CLA_REGISTRY_PATH ?? "CLA_REGISTRY.yaml";
const result = evaluateContributorAgreement(
  {
    githubId: Number(idText),
    labels: parseLabels(process.env.PULL_REQUEST_LABELS),
    headRef: process.env.PULL_REQUEST_HEAD_REF ?? "",
    headRepository: process.env.PULL_REQUEST_HEAD_REPOSITORY ?? "",
    baseRepository: process.env.BASE_REPOSITORY ?? "",
  },
  await readFile(registryPath, "utf8"),
);

console.log(result.summary);
process.exit(result.authorized ? 0 : 1);
