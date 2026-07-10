import { describe, expect, it } from "vitest";
import { validateConfig } from "@/lib/scan/config";

describe("config validation", () => {
  it("requires repo paths", () => {
    const errors = validateConfig({ repos: [{} as { path: string }] });
    expect(errors[0]).toContain("path is required");
  });
});
