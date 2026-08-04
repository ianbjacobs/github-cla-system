import { describe, expect, it } from "vitest";
import { agreementTargetBranch } from "../lib/agreement-target.js";

describe("agreement target branch", () => {
  it("reads the prefilled target branch from an issue form body", () => {
    const body = `### Target branch\n\ntest-clean\n\n### Agreement acceptance\n\n- [x] I agree`;
    expect(agreementTargetBranch(body, "main")).toBe("test-clean");
  });

  it("falls back to the default branch when the field is absent", () => {
    expect(agreementTargetBranch("### Agreement acceptance\n\n- [x] I agree", "main")).toBe("main");
  });

  it("supports slash-delimited branch names", () => {
    const body = `### Target branch\n\nrelease/next\n`;
    expect(agreementTargetBranch(body, "main")).toBe("release/next");
  });

  it("falls back when GitHub records no response", () => {
    const body = `### Target branch\n\n_No response_\n`;
    expect(agreementTargetBranch(body, "main")).toBe("main");
  });
});
