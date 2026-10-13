import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { hashContent, isSkillReplacementUnsafe } from "@/cli/state";

const directories: string[] = [];

afterEach(() => {
  for (const directory of directories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

function skillFile(content: string) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "skill-dockyard-update-"));
  directories.push(directory);
  const file = path.join(directory, "SKILL.md");
  fs.writeFileSync(file, content, "utf8");
  return file;
}

describe("connected-computer update safety", () => {
  it("allows replacement only when the installed content still matches its recorded hash", () => {
    const file = skillFile("published instructions");
    expect(isSkillReplacementUnsafe(file, hashContent("published instructions"))).toBe(false);
  });

  it("refuses to replace a locally changed skill", () => {
    const file = skillFile("local edit");
    expect(isSkillReplacementUnsafe(file, hashContent("published instructions"))).toBe(true);
  });

  it("refuses to replace an unmanaged skill", () => {
    const file = skillFile("instructions from another source");
    expect(isSkillReplacementUnsafe(file, null)).toBe(true);
  });
});
