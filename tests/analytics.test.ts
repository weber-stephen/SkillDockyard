import { describe, expect, it } from "vitest";
import { campaignParameters, isValidGtmContainerId, routeCategory } from "@/lib/analytics";

describe("analytics privacy boundaries", () => {
  it("uses route categories instead of dynamic identifiers or invitation tokens", () => {
    expect(routeCategory("/app/artifacts/0d84c306-29f8-4337-a011-6f93f13c4a4e")).toBe("app_skill_detail");
    expect(routeCategory("/invite/secret-invite-token")).toBe("workspace_invitation");
    expect(routeCategory("/demo/artifacts/art_release_captain/review")).toBe("demo_review");
  });

  it("exports only safe, allowlisted campaign labels", () => {
    expect(campaignParameters("?utm_source=newsletter&utm_medium=email&utm_campaign=fall_launch&token=secret")).toEqual({
      utm_source: "newsletter",
      utm_medium: "email",
      utm_campaign: "fall_launch"
    });
    expect(campaignParameters("?utm_source=person@example.com&utm_campaign=contains%20spaces")).toEqual({});
  });

  it("only accepts GTM container IDs", () => {
    expect(isValidGtmContainerId("GTM-KPDZ7DCL")).toBe(true);
    expect(isValidGtmContainerId("https://tracker.example")).toBe(false);
    expect(isValidGtmContainerId(undefined)).toBe(false);
  });
});
