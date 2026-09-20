import fs from "node:fs";
import path from "node:path";
import { Command, Flags } from "@oclif/core";
import { installRoot } from "@/cli/state";

export default class InstallHelper extends Command {
  static override description = "Install a helper skill that checks Skill Dockyard updates when you ask.";
  static override flags = { target: Flags.string({ options: ["codex", "claude-code"], required: true }) };
  async run() {
    const { flags } = await this.parse(InstallHelper);
    const destination = path.join(installRoot(flags.target as "codex" | "claude-code"), "skill-dockyard-manager");
    if (fs.existsSync(destination)) this.error("The skill-dockyard-manager folder already exists; it was not overwritten.");
    fs.mkdirSync(destination, { recursive: true });
    fs.writeFileSync(path.join(destination, "SKILL.md"), `---\nname: Skill Dockyard Manager\ndescription: Check for approved Skill Dockyard updates and install them only after the user confirms.\n---\n\n# Skill Dockyard Manager\n\nWhen the user asks about skill updates, run \`npx skill-dockyard check\`. Explain the available updates and ask for confirmation before running \`npx skill-dockyard update --all\`. Never overwrite locally modified skills or update without confirmation.\n`, "utf8");
    this.log(`Installed the helper skill for ${flags.target}.`);
  }
}
