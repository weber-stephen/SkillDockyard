import fs from "node:fs";
import path from "node:path";
import { Command, Flags } from "@oclif/core";
import { toCsv } from "@/lib/scan/export";
import { loadConfig } from "@/lib/scan/config";
import { scanRepos } from "@/lib/scan/scanner";

export default class Export extends Command {
  static override description = "Export catalog and risk data as JSON or CSV.";

  static override flags = {
    config: Flags.string({ char: "c", default: "skill-dockyard.yml", description: "Path to scanner config." }),
    repo: Flags.string({ char: "r", description: "Repo path to scan before export." }),
    format: Flags.string({ char: "f", default: "json", options: ["json", "csv"], description: "Export format." }),
    output: Flags.string({ char: "o", description: "Output file path." })
  };

  async run() {
    const { flags } = await this.parse(Export);
    const config = loadConfig(flags.config);
    const artifacts = await scanRepos({ repo: flags.repo, config });
    const output = flags.format === "csv" ? toCsv(artifacts) : JSON.stringify({ generatedAt: new Date().toISOString(), artifacts }, null, 2);
    const outputPath = path.resolve(flags.output ?? `skill-dockyard-export.${flags.format}`);
    fs.writeFileSync(outputPath, output, "utf8");
    this.log(`Exported ${artifacts.length} artifacts to ${outputPath}`);
  }
}
