# Skill Dockyard Marketing & Sales Examples

This is a small, safe shared-skill library for marketing and sales teams. It shows how a useful AI workflow can be downloaded, improved, reviewed, and shared without using Git or a command line.

## Skills in this library

- **Campaign Brief Builder** — turns a campaign idea into clear messages, channel ideas, and a sales handoff.
- **Sales Discovery Prep** — prepares a thoughtful account brief, discovery questions, and a call agenda.
- **Customer Voice Digest** — turns customer feedback into useful themes and practical next steps.

Each skill is a portable `SKILL.md` file that can be used with Codex or Claude Code.

## Try it in Skill Dockyard

The scanner belongs to the Skill Dockyard app repository. From that checkout, scan this example repository:

```bash
npm run cli -- scan --repo ../skill-dockyard-example-repo
```

To send the results to a running local Skill Dockyard app:

```bash
npm run cli -- scan --repo ../skill-dockyard-example-repo --endpoint http://localhost:3000/api/scan
```

You should find three shared skills. They intentionally have no external tools, local services, or sample credentials, so teams can focus on the simple sharing workflow first. In a Git clone, Skill Dockyard also records the most recent editor as the starting owner for each skill.
