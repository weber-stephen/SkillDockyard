import { Command, Flags } from "@oclif/core";
import { loadConfig, validateConfig } from "@/lib/scan/config";

export default class ConfigValidate extends Command {
  static override description = "Validate skill-dockyard.yml.";

  static override flags = {
    path: Flags.string({ char: "p", default: "skill-dockyard.yml", description: "Path to config file." })
  };

  async run() {
    const { flags } = await this.parse(ConfigValidate);
    const config = loadConfig(flags.path);
    const errors = validateConfig(config);
    if (errors.length) {
      for (const error of errors) this.log(`- ${error}`);
      this.error("Config is invalid.");
    }
    this.log("Config is valid.");
  }
}
