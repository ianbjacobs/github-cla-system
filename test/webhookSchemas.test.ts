import { describe, expect, it } from "vitest";
import { installationId } from "../src/webhooks/envelope.js";
import { parseSupportedEvent } from "../src/webhooks/schemas.js";

const repository = { name: "repo", owner: { login: "owner" } };
const installation = { id: 123 };

describe("webhook schemas", () => {
  it("parses a supported pull request event", () => {
    const event = parseSupportedEvent("pull_request", {
      action: "opened",
      installation,
      repository,
      pull_request: {
        number: 7,
        body: null,
        user: { id: 42, login: "octocat" },
        head: { sha: "abc123" },
        labels: [],
      },
    });
    expect(event?.event).toBe("pull_request");
  });

  it("rejects malformed and unsupported events", () => {
    expect(parseSupportedEvent("push", {})).toBeNull();
    expect(parseSupportedEvent("issues", { action: "opened" })).toBeNull();
  });

  it("extracts a validated installation id", () => {
    expect(installationId({ installation })).toBe(123);
    expect(() => installationId({ installation: { id: 0 } })).toThrow();
  });
});
