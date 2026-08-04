import { describe, expect, it } from "vitest";
import { agreementBranchName } from "../lib/branch.js";

describe("agreement branch naming", () => {
  it("uses immutable identifiers", () => {
    expect(agreementBranchName(42, 7)).toBe("agreement/42/issue-7");
  });
});
