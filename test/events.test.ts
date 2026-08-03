import { describe, expect, it } from "vitest";
import { installationId, parseSupportedWebhook } from "../src/webhooks/events.js";

const repository = { name: "repo", owner: { login: "owner" } };
const installation = { id: 123 };

describe("webhook event parsing", () => {
  it("parses a supported pull request event", () => {
    const parsed = parseSupportedWebhook("pull_request", {
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
    expect(parsed?.kind).toBe("pull_request");
  });

  it("rejects malformed supported events and ignores unknown events", () => {
    expect(parseSupportedWebhook("issues", { action: "opened" })).toBeNull();
    expect(parseSupportedWebhook("ping", {})).toBeNull();
  });

  it("extracts only a positive installation id", () => {
    expect(installationId({ installation })).toBe(123);
    expect(installationId({ installation: { id: 0 } })).toBeNull();
  });
});
