import { Command } from "@oclif/core";
import { scanRepos } from "@/lib/scan/scanner";
import { loadConfig } from "@/lib/scan/config";
import { api, readState } from "@/cli/state";

export default class ImportInstalled extends Command {
  static override description = "Import skills already installed in Codex or Claude Code.";
  async run() {
    const state = readState();
    const artifacts = await scanRepos({ installed: true, config: loadConfig() });
    const result = await api<{ accepted: number }>(state, "/api/scan", { method: "POST", body: JSON.stringify({ artifacts }) });
    this.log(`Imported ${result.accepted} skill${result.accepted === 1 ? "" : "s"}.`);
  }
}
