import { describe, expect, it } from "vitest";
import { proposalStatusLabel, proposalStatusVariant, validateProposalDecision } from "@/lib/proposals";

describe("proposal lifecycle", () => {
  it("uses human-readable status labels", () => {
    expect(proposalStatusLabel("pending_review")).toBe("Awaiting review");
    expect(proposalStatusLabel("changes_requested")).toBe("Changes requested");
    expect(proposalStatusVariant("published")).toBe("success");
    expect(proposalStatusVariant("pending_review")).toBe("risk");
  });

  it("accepts only proposal review decisions", () => {
    expect(validateProposalDecision("published")).toBe(true);
    expect(validateProposalDecision("changes_requested")).toBe(true);
    expect(validateProposalDecision("rejected")).toBe(true);
    expect(validateProposalDecision("deprecated")).toBe(false);
  });
});
