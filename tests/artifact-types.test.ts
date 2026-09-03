import { describe, expect, it } from "vitest";
import { getArtifactTypeLabel } from "@/lib/artifact-types";

describe("getArtifactTypeLabel", () => {
  it("presents portable skills as shared Codex and Claude Code skills", () => {
    expect(getArtifactTypeLabel("claude_skill")).toBe("Shared skill");
  });
});
