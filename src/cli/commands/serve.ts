import { spawn } from "node:child_process";
import { Command, Flags } from "@oclif/core";

export default class Serve extends Command {
  static override description = "Start the local Skill Dockyard web app.";

  static override flags = {
    port: Flags.integer({ char: "p", default: 3000, description: "Port for the Next.js dev server." })
  };

  async run() {
    const { flags } = await this.parse(Serve);
    this.log(`Starting Skill Dockyard on http://127.0.0.1:${flags.port}`);
    const child = spawn("npm", ["run", "dev", "--", "-p", String(flags.port)], {
      stdio: "inherit",
      shell: false
    });
    child.on("exit", (code) => process.exit(code ?? 0));
  }
}
