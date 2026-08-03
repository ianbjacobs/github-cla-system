import { describe, expect, it } from "vitest";
import { acceptanceComplete, contributionPrNumber } from "../src/application/issueForm.js";

const body = `### Contribution pull request number\n\n#123\n\n### Acceptance\n\n- [x] I have read and agree to the Contributor License Agreement.\n\n### Identity confirmation\n\n- [X] I am submitting this agreement for my own authenticated GitHub account.`;

describe("issue form", () => {
  it("parses acceptance and PR number", () => {
    expect(acceptanceComplete(body)).toBe(true);
    expect(contributionPrNumber(body)).toBe(123);
  });
});
