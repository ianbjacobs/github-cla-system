import { describe, expect, it } from "vitest";
import { acceptanceComplete, checked } from "../src/application/issueForm.js";

const ACCEPTANCE = "I have read and agree to the Contributor License Agreement.";
const IDENTITY = "I am submitting this agreement for my own authenticated GitHub account.";
function issueBody(acceptance = "x", identity = "X") {
  return `### Acceptance\n\n- [${acceptance}] ${ACCEPTANCE}\n\n### Identity confirmation\n\n- [${identity}] ${IDENTITY}`;
}
describe("issue form", () => {
  it("accepts the signing form when both required boxes are checked", () => {
    expect(acceptanceComplete(issueBody())).toBe(true);
  });
  it("rejects the signing form when either required box is unchecked", () => {
    expect(acceptanceComplete(issueBody(" ", "X"))).toBe(false);
    expect(acceptanceComplete(issueBody("x", " "))).toBe(false);
  });
  it("matches checkbox labels case-insensitively while requiring the complete label", () => {
    expect(checked(`- [x] ${ACCEPTANCE.toUpperCase()}`, ACCEPTANCE)).toBe(true);
    expect(checked("- [x] I agree.", ACCEPTANCE)).toBe(false);
  });
});
