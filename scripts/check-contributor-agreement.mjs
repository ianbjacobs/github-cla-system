import { readFile } from "node:fs/promises";
import { findCurrentAgreement, parseRegistry } from "../lib/registry.js";

const idText = process.env.CONTRIBUTOR_GITHUB_ID ?? process.argv[2];
if (!idText || !/^\d+$/.test(idText)) {
  console.error("Set CONTRIBUTOR_GITHUB_ID or pass a numeric GitHub ID.");
  process.exit(2);
}

const registryPath = process.env.AGREEMENTS_PATH ?? "AGREEMENTS.yaml";
const registry = parseRegistry(await readFile(registryPath, "utf8"));
const entry = findCurrentAgreement(registry, Number(idText));
if (!entry) {
  console.error(`No current agreement found for GitHub user ID ${idText}.`);
  process.exit(1);
}
console.log(`Current agreement ${entry.agreementVersion} found for @${entry.githubLogin}.`);
