import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, FileText } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getArtifactDetail } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function ArtifactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artifact = await getArtifactDetail(id);
  if (!artifact) notFound();

  return (
    <div className="space-y-6">
      <header className="grid gap-4 border-b border-border pb-6 lg:grid-cols-[1fr_auto]">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={artifact.status} />
            <Badge variant="outline">{artifact.type.replaceAll("_", " ")}</Badge>
          </div>
          <h1 className="text-3xl font-black">{artifact.name}</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">{artifact.description ?? "No description extracted yet."}</p>
        </div>
        <Button asChild>
          <Link href={`/artifacts/${artifact.id}/review`}>
            Open Review
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <Info label="Repo" value={artifact.repo_name} />
        <Info label="Owner" value={artifact.owner ?? "Unassigned"} />
        <Info label="Updated" value={formatDate(artifact.updated_at)} />
        <Info label="Risks" value={artifact.risk_count.toString()} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-md border border-border bg-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <h2 className="font-black">Current Snapshot</h2>
          </div>
          <pre className="max-h-[440px] overflow-auto rounded-md bg-muted p-4 text-xs leading-6">{artifact.current_version?.content_snapshot}</pre>
        </div>
        <div className="space-y-4">
          <Panel title="Tools" items={artifact.current_version?.tools ?? []} empty="No tools detected." />
          <Panel title="MCP Servers" items={artifact.current_version?.mcp_servers ?? []} empty="No MCP servers detected." />
          <div className="rounded-md border border-border bg-panel p-5">
            <h2 className="mb-3 font-black">Risk Flags</h2>
            <div className="space-y-3">
              {artifact.risks.length ? (
                artifact.risks.map((risk) => (
                  <div key={risk.id} className="rounded-sm border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                    <div className="font-bold">{risk.kind.replaceAll("_", " ")}</div>
                    <p className="mt-1 text-muted-foreground">{risk.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No risks detected.</p>
              )}
            </div>
          </div>
        </div>
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
    <div className="rounded-md border border-border bg-panel p-5">
      <h2 className="mb-3 font-black">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {items.length ? items.map((item) => <Badge key={item} variant="secondary">{item}</Badge>) : <p className="text-sm text-muted-foreground">{empty}</p>}
      </div>
    </div>
  );
}
