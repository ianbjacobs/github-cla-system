import { readFile } from "node:fs/promises";
import { validateSigningIssue } from "../lib/issue-form.js";

const path = process.argv[2];
if (!path) {
  console.error("Usage: node scripts/validate-signing-issue.mjs <issue-body-file>");
  process.exit(2);
}

const result = validateSigningIssue(await readFile(path, "utf8"));
if (!result.valid) {
  console.error(`Missing required acknowledgements: ${result.missing.join("; ")}`);
  process.exit(1);
}
console.log("Signing issue contains all required acknowledgements.");
