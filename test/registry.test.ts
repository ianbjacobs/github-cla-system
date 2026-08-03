import { describe, expect, it } from "vitest";
import {
  addAgreement,
  findAgreement,
  parseRegistry,
  serializeAgreementRecord,
  serializeRegistry,
} from "../src/application/registry.js";

const entry = {
  githubId: 42,
  githubNodeId: "U_42",
  githubLogin: "Octocat",
  agreementVersion: "1.0",
  agreementPath: ".github/cla/agreement.md",
  agreementCommit: "0123456789abcdef",
  signedAt: "2026-08-03T12:00:00.000Z",
  repository: "owner/repo",
  issueNumber: 7,
  issueNodeId: "I_abc",
  recordPath: "agreements/42/1.0.yaml",
};

describe("agreement registry", () => {
  it("round trips a normalized agreement", () => {
    const registry = addAgreement(parseRegistry(null), entry);
    const parsed = parseRegistry(serializeRegistry(registry));
    expect(findAgreement(parsed, 42, "1.0", "OWNER/REPO")).toMatchObject({
      githubId: 42,
      githubLogin: "octocat",
      issueNodeId: "I_abc",
    });
  });

  it("serializes an immutable per-contributor record", () => {
    const record = serializeAgreementRecord(entry);
    expect(record).toContain("githubNodeId: U_42");
    expect(record).toContain("issueNodeId: I_abc");
    expect(record).toContain("agreementCommit: 0123456789abcdef");
  });
});
