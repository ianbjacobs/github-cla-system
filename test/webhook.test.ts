import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyWebhook } from "../src/infrastructure/github/webhook.js";

describe("webhook verification", () => {
  it("accepts a correct sha256 signature", () => {
    const body = Buffer.from('{"ok":true}');
    const secret = "a-very-long-test-secret";
    const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
    expect(verifyWebhook(body, signature, secret)).toBe(true);
    expect(verifyWebhook(body, `${signature}0`, secret)).toBe(false);
  });
});
