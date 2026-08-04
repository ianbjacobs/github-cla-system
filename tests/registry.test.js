import { describe, expect, it } from "vitest";
import {
  addAgreement,
  findCurrentAgreement,
  parseRegistry,
  serializeRegistry,
} from "../lib/registry.js";

const entry = {
  githubId: 42,
  githubNodeId: "U_42",
  githubLogin: "octocat",
  agreementVersion: "1.0",
  signedAt: "2026-08-03T12:00:00Z",
  issueNumber: 7,
  issueNodeId: "I_7",
};

describe("agreement registry", () => {
  it("round trips and finds an agreement by immutable numeric ID", () => {
    const registry = addAgreement(parseRegistry(null), entry);
    const parsed = parseRegistry(serializeRegistry(registry));
    expect(findCurrentAgreement(parsed, 42)).toEqual(entry);
  });

  it("rejects an agreement from an older version", () => {
    const registry = { ...addAgreement(parseRegistry(null), entry), agreementVersion: "2.0" };
    expect(findCurrentAgreement(registry, 42)).toBeNull();
  });

  it("replaces the same user and agreement version deterministically", () => {
    const registry = addAgreement(addAgreement(parseRegistry(null), entry), {
      ...entry,
      githubLogin: "renamed-user",
    });
    expect(registry.agreements).toHaveLength(1);
    expect(registry.agreements[0].githubLogin).toBe("renamed-user");
  });
});
