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
import { PrivateDraftActions } from "@/components/private-draft-actions";

export default async function ArtifactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artifact = await getArtifactDetail(id);
  if (!artifact) notFound();
  const sharableWorkspaces = artifact.can_manage_shares ? await listSharableWorkspaces() : [];
  const sharing = getSharingStatusView(artifact);
  const portable = getPortableSkillStatus(artifact);
  const hasPendingChange = Boolean(artifact.current_version_id && artifact.current_version_id !== artifact.approved_version_id);

  return (
    <div className="space-y-8">
      <header className="grid gap-4 border-b border-border pb-7 lg:grid-cols-[1fr_auto]">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge artifact={artifact} />
            <Badge variant="outline">{getArtifactTypeLabel(artifact.type)}</Badge>
            {artifact.access_scope === "shared_user" ? <Badge variant="secondary">Shared with you</Badge> : null}
            {artifact.access_scope === "shared_workspace" ? <Badge variant="secondary">Shared with your workspace</Badge> : null}
            {artifact.visibility === "private" ? <Badge variant="secondary">Private draft</Badge> : null}
            {artifact.created_by_viewer ? <Badge variant="secondary">Created by you</Badge> : null}
          </div>
          <h1 className="app-page-title">{artifact.name}</h1>
          <p className="app-copy mt-3 max-w-2xl text-muted-foreground">
            {sharing.description} {artifact.description ?? "No description extracted yet."}
          </p>
        </div>
        <Button asChild>
          <Link href={artifact.visibility === "private" ? `/artifacts/${artifact.id}` : `/artifacts/${artifact.id}/review`}>
            {artifact.visibility === "private" ? "View private draft" : artifact.current_proposal ? "Review pending submission" : "Compare versions"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </header>

      <section className="grid gap-x-6 border-y border-border md:grid-cols-2 xl:grid-cols-5">
        <Info label="Relationship" value={artifact.visibility === "private" ? "Owned by you" : artifact.access_scope?.startsWith("shared_") ? "Shared with you" : artifact.created_by_viewer ? "Created by you" : "Workspace skill"} />
        <Info label="Maintained by" value={artifact.owner ?? "Not listed"} />
        <Info label="Managed by" value={artifact.source_workspace_name ?? "Your workspace"} />
        <Info label="Updated" value={formatDate(artifact.updated_at)} />
        <Info label="Review notes" value={artifact.risk_count.toString()} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <div className="min-w-0 rounded-md border border-border bg-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <h2 className="font-black">Current Skill</h2>
          </div>
          {artifact.current_version?.summary ? <p className="mb-4 text-sm leading-6 text-muted-foreground">{artifact.current_version.summary}</p> : null}
          <pre className="max-h-[440px] max-w-full overflow-auto rounded-md bg-muted p-4 text-xs leading-6">{artifact.current_version?.content_snapshot}</pre>
        </div>
        <aside className="min-w-0 space-y-4 xl:sticky xl:top-5">
          {artifact.can_edit_private ? <PrivateDraftActions artifactId={artifact.id} /> : null}
          {artifact.visibility !== "private" && artifact.approved_version ? <SkillDownloadPanel artifactId={artifact.id} approvedHash={artifact.approved_version.content_hash} skillName={artifact.slug} eligible={portable.eligible} reason={portable.reason} hasPendingChange={hasPendingChange} /> : null}
          {artifact.can_manage_shares ? <ShareSkillPanel artifact={artifact} workspaces={sharableWorkspaces} /> : null}
          {artifact.can_propose_update ? <div className="rounded-md border border-border bg-panel p-5 text-sm leading-6 text-muted-foreground"><p>You can submit an update to this skill. The published version stays active until the workspace owner or a reviewer publishes the submission.</p><Button asChild variant="outline" size="sm" className="mt-4"><Link href={`/artifacts/${artifact.id}/update`}>Submit an update<ArrowRight className="h-3.5 w-3.5" /></Link></Button></div> : null}
          {!artifact.can_manage_shares && !artifact.can_propose_update && artifact.access_scope?.startsWith("shared_") ? (
            <div className="rounded-md border border-border bg-panel p-5 text-sm leading-6 text-muted-foreground">
              You have view-only access to this shared skill. You can download and compare it, but you cannot propose updates or publish changes.
            </div>
          ) : null}
          <div className="rounded-md border border-border bg-panel p-5">
            {artifact.current_proposal ? <div className="mb-4 rounded-sm border border-attention/40 bg-attention/10 p-3 text-sm leading-6"><div className="font-bold">Pending submission</div><p className="mt-1 text-muted-foreground">This change is not published yet. Teammates will continue receiving the published version until an owner or reviewer publishes it.</p></div> : null}
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
              <Panel title="Connectors" items={artifact.current_version?.mcp_servers ?? []} empty="No connectors detected." />
            </div>
            <div className="space-y-3">
              {artifact.risks.length ? (
                artifact.risks.map((risk) => (
                  <div key={risk.id} className="rounded-sm border border-attention/40 bg-attention/10 p-3 text-sm">
                    <div className="font-bold">{risk.kind.replaceAll("_", " ")}</div>
                    <p className="mt-1 text-muted-foreground">{risk.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No review notes found.</p>
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
    <div className="min-w-0 border-b border-border py-4 xl:border-b-0">
      <div className="eyebrow text-muted-foreground">{label}</div>
      <div className="mt-2 truncate text-base font-bold">{value}</div>
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
