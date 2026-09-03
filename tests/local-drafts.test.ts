import { describe, expect, it } from "vitest";
import { localDraftsStorageKey, readLocalDrafts, writeLocalDraft } from "@/lib/local-drafts";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => [...values.keys()][index] ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => {
      values.set(key, value);
    }
  };
}

describe("local drafts", () => {
  it("saves a browser-local new skill draft", () => {
    const storage = memoryStorage();
    const draft = writeLocalDraft(storage, {
      mode: "new",
      name: "Support Triage",
      owner: "Support Ops",
      libraryArea: "General Skills",
      path: "",
      changeSummary: "Reusable support escalation workflow.",
      trustNotes: 1
    });

    expect(draft.workspace_id).toBe("local-browser");
    expect(draft.repo_name).toBe("General Skills");
    expect(draft.path).toBe("submitted/support-triage.md");
    expect(readLocalDrafts(storage)).toHaveLength(1);
    expect(storage.getItem(localDraftsStorageKey)).toContain("Support Triage");
  });

  it("inherits update draft metadata from the existing skill", () => {
    const storage = memoryStorage();
    const draft = writeLocalDraft(storage, {
      mode: "update",
      existingArtifact: {
        id: "art_release",
        name: "Release Captain",
        repo_name: "platform-tools",
        path: "skills/release-captain/SKILL.md",
        type: "claude_skill",
        owner: "@platform"
      },
      name: "",
      owner: "",
      libraryArea: "",
      path: "",
      changeSummary: "Adds billing release checks.",
      trustNotes: 2
    });

    expect(draft.name).toBe("Release Captain");
    expect(draft.owner).toBe("@platform");
    expect(draft.repo_name).toBe("platform-tools");
    expect(draft.status).toBe("needs_reapproval");
  });
});
