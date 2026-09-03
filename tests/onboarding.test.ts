import { describe, expect, it } from "vitest";
import { onboardingComplete, type OnboardingState } from "@/lib/onboarding";

const empty: OnboardingState = { selectedPath: null, exploredDemoAt: null, firstSubmissionAt: null, firstScanAt: null, dismissedAt: null };

describe("workspace onboarding", () => {
  it("requires a real product milestone before setup is complete", () => {
    expect(onboardingComplete(empty)).toBe(false);
    expect(onboardingComplete({ ...empty, selectedPath: "share" })).toBe(false);
    expect(onboardingComplete({ ...empty, firstSubmissionAt: "2026-09-01T00:00:00.000Z" })).toBe(true);
  });

  it("recognizes demo and scan activation as completed outcomes", () => {
    expect(onboardingComplete({ ...empty, exploredDemoAt: "2026-09-01T00:00:00.000Z" })).toBe(true);
    expect(onboardingComplete({ ...empty, firstScanAt: "2026-09-01T00:00:00.000Z" })).toBe(true);
  });
});
