import { Command, Flags } from "@oclif/core";
import { newDeviceId, writeState } from "@/cli/state";

export default class Connect extends Command {
  static override description = "Connect this computer to your Skill Dockyard account.";
  static override flags = { endpoint: Flags.string({ required: true, description: "Your Skill Dockyard URL." }), code: Flags.string({ required: true, description: "One-time pairing code from Skill Dockyard." }) };
  async run() {
    const { flags } = await this.parse(Connect);
    const endpoint = flags.endpoint.replace(/\/$/, "");
    const response = await fetch(`${endpoint}/api/cli/pair`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: flags.code }) });
    const body = await response.json();
    if (!response.ok) this.error(body.error ?? "Pairing failed.");
    writeState({ endpoint, token: body.token, deviceId: newDeviceId(), installs: [] });
    this.log(`Connected. This authorization expires ${new Date(body.expiresAt).toLocaleDateString()}.`);
  }
}
