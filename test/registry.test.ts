import { describe, expect, it } from "vitest";
import {
  addAgreement,
  findAgreement,
  parseRegistry,
  serializeRegistry,
} from "../src/application/registry.js";

const entry = {
  githubId: 42,
  githubLogin: "Octocat",
  agreementVersion: "1.0",
  signedAt: "2026-08-03T12:00:00.000Z",
  repository: "owner/repo",
  issueNumber: 7,
  issueNodeId: "I_abc",
  contributionPullRequestNumber: 9,
};

describe("agreement registry", () => {
  it("round trips and looks up by immutable user id", () => {
    const registry = addAgreement(parseRegistry(null), entry);
    const parsed = parseRegistry(serializeRegistry(registry));
    expect(findAgreement(parsed, 42, "1.0", "owner/repo")?.githubLogin).toBe("octocat");
  });
  it("rejects conflicting duplicate entries", () => {
    const registry = addAgreement(parseRegistry(null), entry);
    expect(() => addAgreement(registry, { ...entry, issueNumber: 8 })).toThrow(/conflicting/);
  });
});
