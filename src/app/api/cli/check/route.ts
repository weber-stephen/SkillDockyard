import { NextResponse } from "next/server";
import { getArtifactForCli, resolveCliToken } from "@/lib/cli-auth";
import { z } from "zod";
import { readJsonSchema } from "@/lib/request-body";

const checkSchema = z.object({ installed: z.array(z.object({ artifactId: z.uuid(), contentHash: z.string().min(16).max(256), target: z.enum(["codex", "claude-code"]).optional() }).strict()).max(500) }).strict();

export async function POST(request: Request) {
  const identity = await resolveCliToken(request);
  if (!identity) return NextResponse.json({ error: "Connect the Skill Dockyard CLI again." }, { status: 401 });
  const body = await readJsonSchema(request, checkSchema, 256 * 1024);
  const updates = [];
  for (const item of body.installed) {
    const artifact = await getArtifactForCli(item.artifactId, identity);
    const version = artifact?.visibility === "private" ? artifact.current_version : artifact?.approved_version;
    if (artifact && version && version.content_hash !== item.contentHash) updates.push({ artifactId: artifact.id, name: artifact.name, slug: artifact.slug, currentHash: item.contentHash, availableHash: version.content_hash, versionId: version.id });
  }
  return NextResponse.json({ updates });
}
