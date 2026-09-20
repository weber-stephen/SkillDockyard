import fs from "node:fs";
import { Command, Flags } from "@oclif/core";
import { api, hashContent, readState } from "@/cli/state";

export default class Check extends Command {
  static override description = "Check installed Skill Dockyard skills for approved updates.";
  static override flags = { json: Flags.boolean({ default: false }) };
  async run() {
    const { flags } = await this.parse(Check);
    const state = readState();
    const installed = state.installs.map((item) => ({ artifactId: item.artifactId, contentHash: fs.existsSync(item.path) ? hashContent(fs.readFileSync(item.path, "utf8")) : item.contentHash, target: item.target }));
    const result = await api<{ updates: Array<{ artifactId: string; name: string; availableHash: string }> }>(state, "/api/cli/check", { method: "POST", body: JSON.stringify({ installed }) });
    if (flags.json) return this.log(JSON.stringify(result));
    if (!result.updates.length) return this.log("All CLI-managed skills are up to date.");
    this.log(`${result.updates.length} update${result.updates.length === 1 ? " is" : "s are"} available:`);
    result.updates.forEach((item) => this.log(`- ${item.name} (${item.artifactId})`));
    this.log("Run `skill-dockyard update --all` to install them.");
  }
}
