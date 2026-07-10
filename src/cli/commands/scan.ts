import { Command, Flags } from "@oclif/core";
import { loadConfig } from "@/lib/scan/config";
import { scanRepos } from "@/lib/scan/scanner";

export default class Scan extends Command {
  static override description = "Scan local Git repos for AI artifacts.";

  static override flags = {
    config: Flags.string({ char: "c", default: "skill-dockyard.yml", description: "Path to scanner config." }),
    repo: Flags.string({ char: "r", description: "Repo path to scan instead of configured repos." }),
    endpoint: Flags.string({ description: "Skill Dockyard API endpoint for scan ingest." }),
    json: Flags.boolean({ default: false, description: "Print JSON output." })
  };

  async run() {
    const { flags } = await this.parse(Scan);
    const config = loadConfig(flags.config);
    const artifacts = await scanRepos({ repo: flags.repo, config });

    if (flags.endpoint) {
      const response = await fetch(flags.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artifacts })
      });
      if (!response.ok) this.error(`Ingest failed: ${response.status} ${await response.text()}`);
    }

    if (flags.json) {
      this.log(JSON.stringify({ count: artifacts.length, artifacts }, null, 2));
      return;
    }

    this.log(`Scanned ${artifacts.length} artifact${artifacts.length === 1 ? "" : "s"}.`);
    for (const item of artifacts) {
      this.log(`- ${item.artifact.name} (${item.artifact.type}) ${item.artifact.path} risks=${item.risks.length}`);
    }
  }
}
