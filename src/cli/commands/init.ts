import fs from "node:fs";
import path from "node:path";
import { Command, Flags } from "@oclif/core";

export default class Init extends Command {
  static override description = "Create a starter skill-dockyard.yml config.";

  static override flags = {
    path: Flags.string({ char: "p", default: "skill-dockyard.yml", description: "Config path to create." }),
    force: Flags.boolean({ char: "f", default: false, description: "Overwrite an existing config." })
  };

  async run() {
    const { flags } = await this.parse(Init);
    const target = path.resolve(flags.path);
    if (fs.existsSync(target) && !flags.force) {
      this.error(`${flags.path} already exists. Re-run with --force to overwrite.`);
    }

    const content = `workspace:
  name: Skill Dockyard Local
  reviewer: Local Reviewer

repos:
  - name: current
    path: .

riskRules:
  approvedMcpServers: []
  highImpactTools:
    - shell
    - exec
    - stripe
    - github:write
    - database:write
`;
    fs.writeFileSync(target, content, "utf8");
    this.log(`Created ${flags.path}`);
  }
}
