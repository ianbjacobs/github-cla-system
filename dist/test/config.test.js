import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, parseRepositoryConfig } from "../src/config/repositoryConfig.js";

describe("repository CLA configuration", () => {
  it("uses backward-compatible repository-scoped defaults", () => {
    expect(parseRepositoryConfig(null)).toEqual(DEFAULT_CONFIG);
  });
  it("parses an organization policy repository", () => {
    const config = parseRepositoryConfig(`
schemaVersion: 1
agreementVersion: "2.0"
agreementScope: organization
policyRepository: example/contributor-agreements
`);
    expect(config.agreementVersion).toBe("2.0");
    expect(config.agreementScope).toBe("organization");
    expect(config.policyRepository).toEqual({ owner: "example", repo: "contributor-agreements" });
  });
  it("requires a central repository for organization scope", () => {
    expect(() => parseRepositoryConfig("agreementScope: organization")).toThrow(
      "Organization-scoped agreements require policyRepository.",
    );
  });
});
