import fs from "node:fs";
import path from "node:path";
import { Args, Command, Flags } from "@oclif/core";
import { api, hashContent, installRoot, readState, writeState, type CliInstall } from "@/cli/state";

type SkillPayload = { artifactId: string; versionId: string; slug: string; contentHash: string; content: string };

export default class Update extends Command {
  static override description = "Install an approved skill or safely update CLI-managed skills.";
  static override args = { artifact: Args.string({ description: "Skill ID to install or update." }) };
  static override flags = { all: Flags.boolean({ default: false }), target: Flags.string({ options: ["codex", "claude-code"], default: "codex" }) };
  async run() {
    const { args, flags } = await this.parse(Update);
    const state = readState();
    const targets = flags.all ? state.installs.map((item) => ({ artifactId: item.artifactId, target: item.target })) : args.artifact ? [{ artifactId: args.artifact, target: flags.target as CliInstall["target"] }] : [];
    if (!targets.length) this.error("Provide a skill ID or use --all.");
    const uniqueTargets = [...new Map(targets.map((item) => [`${item.artifactId}:${item.target}`, item])).values()];
    for (const { artifactId, target } of uniqueTargets) {
      const existing = state.installs.find((item) => item.artifactId === artifactId && item.target === target);
      if (existing && fs.existsSync(existing.path) && hashContent(fs.readFileSync(existing.path, "utf8")) !== existing.contentHash) {
        this.warn(`${existing.slug} has local changes. It was not downloaded or overwritten.`);
        continue;
      }
      const payload = await api<SkillPayload>(state, `/api/cli/skills/${artifactId}?target=${target}`);
      const destination = path.join(installRoot(target), payload.slug);
      const skillFile = path.join(destination, "SKILL.md");
      if (fs.existsSync(skillFile)) {
        const currentHash = hashContent(fs.readFileSync(skillFile, "utf8"));
        if (!existing || currentHash !== existing.contentHash) {
          this.warn(`${payload.slug} has local changes or was not installed by this CLI. It was not overwritten.`);
          continue;
        }
      }
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      const temporary = `${destination}.skill-dockyard-${process.pid}`;
      fs.mkdirSync(temporary, { recursive: false });
      fs.writeFileSync(path.join(temporary, "SKILL.md"), payload.content, "utf8");
      if (hashContent(fs.readFileSync(path.join(temporary, "SKILL.md"), "utf8")) !== payload.contentHash) this.error(`Hash verification failed for ${payload.slug}.`);
      const previous = `${destination}.skill-dockyard-previous-${process.pid}`;
      const movedPrevious = fs.existsSync(destination);
      if (movedPrevious) fs.renameSync(destination, previous);
      try {
        fs.renameSync(temporary, destination);
      } catch (error) {
        if (movedPrevious && fs.existsSync(previous) && !fs.existsSync(destination)) fs.renameSync(previous, destination);
        throw error;
      }
      if (fs.existsSync(previous)) fs.rmSync(previous, { recursive: true });
      const record: CliInstall = { artifactId, versionId: payload.versionId, slug: payload.slug, target, path: path.join(destination, "SKILL.md"), contentHash: payload.contentHash };
      state.installs = [...state.installs.filter((item) => !(item.artifactId === artifactId && item.target === record.target)), record];
      writeState(state);
      await api(state, "/api/cli/installations", { method: "PUT", body: JSON.stringify({ artifactId, versionId: payload.versionId, contentHash: payload.contentHash, deviceId: state.deviceId, target: record.target }) });
      this.log(`Installed ${payload.slug} for ${record.target}.`);
    }
  }
}
