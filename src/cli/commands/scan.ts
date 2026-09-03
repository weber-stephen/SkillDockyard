import { Command, Flags } from "@oclif/core";
import { loadConfig } from "@/lib/scan/config";
import { scanRepos } from "@/lib/scan/scanner";

export default class Scan extends Command {
  static override description = "Scan installed Codex or Claude Code skills, or a local repository.";

  static override flags = {
    config: Flags.string({ char: "c", default: "skill-dockyard.yml", description: "Path to scanner config." }),
    repo: Flags.string({ char: "r", description: "Repo path to scan instead of configured repos." }),
    installed: Flags.boolean({ default: false, description: "Scan skills installed in Codex and Claude Code on this computer." }),
    endpoint: Flags.string({ description: "Skill Dockyard API endpoint for scan ingest." }),
    token: Flags.string({ description: "Ingest token for an authenticated Skill Dockyard API endpoint." }),
    json: Flags.boolean({ default: false, description: "Print JSON output." })
  };

  async run() {
    const { flags } = await this.parse(Scan);
    const config = loadConfig(flags.config);
    const artifacts = await scanRepos({ repo: flags.repo, installed: flags.installed, config });

    if (flags.endpoint) {
      const response = await fetch(flags.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(flags.token ? { Authorization: `Bearer ${flags.token}` } : {}) },
        body: JSON.stringify({ artifacts })
      });
      if (!response.ok) this.error(`Ingest failed: ${response.status} ${await response.text()}`);
    }

    if (flags.json) {
      this.log(JSON.stringify({ count: artifacts.length, artifacts }, null, 2));
      return;
    }

    this.log(`Scanned ${artifacts.length} skill file${artifacts.length === 1 ? "" : "s"}.`);
    for (const item of artifacts) {
      this.log(`- ${item.artifact.name} (${item.artifact.type}) ${item.artifact.path} trust_notes=${item.risks.length}`);
    }
  }
}
