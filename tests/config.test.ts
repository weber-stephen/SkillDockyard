import { describe, expect, it } from "vitest";
import { validateConfig } from "@/lib/scan/config";
import { normalizeStringList } from "@/lib/settings";

describe("config validation", () => {
  it("requires repo paths", () => {
    const errors = validateConfig({ repos: [{} as { path: string }] });
    expect(errors[0]).toContain("path is required");
  });

  it("normalizes setting lists", () => {
    expect(normalizeStringList([" github ", "github", "", "shell"])).toEqual(["github", "shell"]);
  });
});
