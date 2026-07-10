import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ReviewActions } from "@/components/review-actions";
import { getArtifactDetail } from "@/lib/data";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artifact = await getArtifactDetail(id);
  if (!artifact || !artifact.current_version) notFound();

  return (
    <div className="space-y-6">
      <header className="border-b border-border pb-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge variant="outline">{artifact.repo_name}</Badge>
          <Badge variant="outline">{artifact.path}</Badge>
        </div>
        <h1 className="text-3xl font-black">Review {artifact.name}</h1>
        <p className="mt-2 text-muted-foreground">Reviewer-facing summary, deterministic risks, and hash-tied approval.</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
        <div className="space-y-4">
          <div className="rounded-md border border-border bg-panel p-5">
            <h2 className="font-black">Plain-English Summary</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              {artifact.current_version.summary ?? "No generated summary yet. The deterministic risk flags are still available for review."}
            </p>
          </div>
          <div className="rounded-md border border-border bg-panel p-5">
            <h2 className="font-black">Diff Basis</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Comparing the current content hash against the last approved hash. A full visual diff can be added after the first pilot confirms review workflow value.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Hash label="Current" value={artifact.current_version.content_hash} />
              <Hash label="Approved" value={artifact.approved_version?.content_hash ?? "None"} />
            </div>
          </div>
          <div className="rounded-md border border-border bg-panel p-5">
            <h2 className="font-black">Current Content</h2>
            <pre className="mt-4 max-h-[520px] overflow-auto rounded-md bg-muted p-4 text-xs leading-6">{artifact.current_version.content_snapshot}</pre>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-md border border-border bg-panel p-5">
            <h2 className="font-black">Risk Flags</h2>
            <div className="mt-4 space-y-3">
              {artifact.risks.map((risk) => (
                <div key={risk.id} className="rounded-sm border border-amber-500/30 bg-amber-500/10 p-3">
                  <div className="text-sm font-bold">{risk.kind.replaceAll("_", " ")}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{risk.message}</p>
                  {risk.evidence ? <code className="mt-2 block text-xs">{risk.evidence}</code> : null}
                </div>
              ))}
              {!artifact.risks.length ? <p className="text-sm text-muted-foreground">No risks detected.</p> : null}
            </div>
          </div>
          <ReviewActions artifactId={artifact.id} versionId={artifact.current_version.id} />
        </div>
      </section>
    </div>
  );
}

function Hash({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border bg-background p-3">
      <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <code className="mt-2 block truncate text-xs">{value}</code>
    </div>
  );
}
