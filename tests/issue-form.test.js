import { describe, expect, it } from "vitest";
import { validateSigningIssue } from "../lib/issue-form.js";

const valid = `
- [x] I have read and agree to the Contributor Agreement.
- [X] I am submitting this agreement for my own authenticated GitHub account.
`;

describe("signing issue validation", () => {
  it("accepts both exact checked acknowledgements", () => {
    expect(validateSigningIssue(valid)).toEqual({ valid: true, missing: [] });
  });

  it("rejects a missing acknowledgement", () => {
    const result = validateSigningIssue(
      "- [x] I have read and agree to the Contributor Agreement.",
    );
    expect(result.valid).toBe(false);
    expect(result.missing).toHaveLength(1);
  });

  it("does not accept approximate checkbox text", () => {
    const result = validateSigningIssue("- [x] I agree.");
    expect(result.valid).toBe(false);
  });
});
