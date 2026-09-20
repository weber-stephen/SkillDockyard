import { NextResponse } from "next/server";
import { getArtifactForCli, resolveCliToken } from "@/lib/cli-auth";

export async function POST(request: Request) {
  const identity = await resolveCliToken(request);
  if (!identity) return NextResponse.json({ error: "Connect the Skill Dockyard CLI again." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { installed?: Array<{ artifactId?: unknown; contentHash?: unknown; target?: unknown }> };
  if (!Array.isArray(body.installed) || body.installed.length > 500) return NextResponse.json({ error: "Provide a bounded installed-skills list." }, { status: 400 });
  const updates = [];
  for (const item of body.installed) {
    if (typeof item.artifactId !== "string" || typeof item.contentHash !== "string") continue;
    const artifact = await getArtifactForCli(item.artifactId, identity);
    const version = artifact?.visibility === "private" ? artifact.current_version : artifact?.approved_version;
    if (artifact && version && version.content_hash !== item.contentHash) updates.push({ artifactId: artifact.id, name: artifact.name, slug: artifact.slug, currentHash: item.contentHash, availableHash: version.content_hash, versionId: version.id });
  }
  return NextResponse.json({ updates });
}
