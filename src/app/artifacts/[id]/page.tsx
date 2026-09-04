import { ProductLink as Link } from "@/components/product-link";
import { notFound } from "next/navigation";
import { ArrowRight, FileText, ShieldCheck } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getArtifactDetail } from "@/lib/data";
import { getArtifactTypeLabel } from "@/lib/artifact-types";
import { getSharingStatusView } from "@/lib/sharing";
import { getPortableSkillStatus } from "@/lib/skill-download";
import { formatDate } from "@/lib/utils";
import { SkillDownloadPanel } from "@/components/skill-download-panel";
import { listSharableWorkspaces } from "@/lib/shares";
import { ShareSkillPanel } from "@/components/share-skill-panel";

export default async function ArtifactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artifact = await getArtifactDetail(id);
  if (!artifact) notFound();
  const sharableWorkspaces = artifact.can_manage_shares ? await listSharableWorkspaces() : [];
  const sharing = getSharingStatusView(artifact);
  const portable = getPortableSkillStatus(artifact);
  const hasPendingChange = Boolean(artifact.current_version_id && artifact.current_version_id !== artifact.approved_version_id);

  return (
    <div className="space-y-6">
      <header className="grid gap-4 border-b border-border pb-6 lg:grid-cols-[1fr_auto]">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge artifact={artifact} />
            <Badge variant="outline">{getArtifactTypeLabel(artifact.type)}</Badge>
            {artifact.access_scope === "shared_user" ? <Badge variant="secondary">Shared with you</Badge> : null}
            {artifact.access_scope === "shared_workspace" ? <Badge variant="secondary">Shared with your workspace</Badge> : null}
          </div>
          <h1 className="text-3xl font-black">{artifact.name}</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            {sharing.description} {artifact.description ?? "No description extracted yet."}
          </p>
        </div>
        <Button asChild>
          <Link href={`/artifacts/${artifact.id}/review`}>
            Compare Versions
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <Info label="Repo" value={artifact.repo_name} />
        <Info label="Owner" value={artifact.owner ?? "Unassigned"} />
        <Info label="Source Workspace" value={artifact.source_workspace_name ?? "Private workspace"} />
        <Info label="Updated" value={formatDate(artifact.updated_at)} />
        <Info label="Trust Notes" value={artifact.risk_count.toString()} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(24rem,0.88fr)]">
        <div className="min-w-0 rounded-md border border-border bg-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <h2 className="font-black">Current Skill</h2>
          </div>
          {artifact.current_version?.summary ? <p className="mb-4 text-sm leading-6 text-muted-foreground">{artifact.current_version.summary}</p> : null}
          <pre className="max-h-[440px] max-w-full overflow-auto rounded-md bg-muted p-4 text-xs leading-6">{artifact.current_version?.content_snapshot}</pre>
        </div>
        <aside className="min-w-0 space-y-4">
          <SkillDownloadPanel artifactId={artifact.id} approvedHash={artifact.approved_version?.content_hash ?? null} skillName={artifact.slug} eligible={portable.eligible} reason={portable.reason} hasPendingChange={hasPendingChange} />
          {artifact.can_manage_shares ? <ShareSkillPanel artifact={artifact} workspaces={sharableWorkspaces} /> : null}
          {!artifact.can_manage_shares && artifact.can_propose_update ? (
            <div className="rounded-md border border-border bg-panel p-5 text-sm leading-6 text-muted-foreground">
              You can propose updates to this shared skill. Publishing still requires a source workspace owner or reviewer.
            </div>
          ) : null}
          {!artifact.can_manage_shares && !artifact.can_propose_update && artifact.access_scope?.startsWith("shared_") ? (
            <div className="rounded-md border border-border bg-panel p-5 text-sm leading-6 text-muted-foreground">
              You have view-only access to this shared skill. You can download and compare it, but you cannot propose updates or publish changes.
            </div>
          ) : null}
          <div className="rounded-md border border-border bg-panel p-5">
            <h2 className="font-black">Published Version</h2>
            {artifact.approved_version ? (
              <div className="mt-3 space-y-3">
                <p className="text-sm leading-6 text-muted-foreground">{artifact.approved_version.summary ?? "Published shared version."}</p>
                <code className="block truncate rounded-sm bg-muted p-3 text-xs">{artifact.approved_version.content_hash}</code>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">No published shared version exists yet.</p>
            )}
          </div>
          <div className="rounded-md border border-border bg-panel p-5">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <h2 className="font-black">Compatibility and Trust Signals</h2>
            </div>
            <div className="mb-4 grid gap-3">
              <Panel title="Tools" items={artifact.current_version?.tools ?? []} empty="No tools detected." />
              <Panel title="MCP Servers" items={artifact.current_version?.mcp_servers ?? []} empty="No MCP servers detected." />
            </div>
            <div className="space-y-3">
              {artifact.risks.length ? (
                artifact.risks.map((risk) => (
                  <div key={risk.id} className="rounded-sm border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                    <div className="font-bold">{risk.kind.replaceAll("_", " ")}</div>
                    <p className="mt-1 text-muted-foreground">{risk.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No trust notes detected.</p>
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-panel p-4">
      <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-3 truncate text-lg font-black">{value}</div>
    </div>
  );
}

function Panel({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div>
      <h2 className="mb-3 font-black">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {items.length ? items.map((item) => <Badge key={item} variant="secondary">{item}</Badge>) : <p className="text-sm text-muted-foreground">{empty}</p>}
      </div>
    </div>
  );
}
