import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ReviewActions } from "@/components/review-actions";
import { getArtifactDetail } from "@/lib/data";
import { getPublishRecommendation, getSharingStatusView } from "@/lib/sharing";
import { getProposal } from "@/lib/proposals";
import { getProductMode } from "@/lib/product-mode";

export default async function ReviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<{ proposal?: string }> }) {
  const { id } = await params;
  const artifact = await getArtifactDetail(id);
  if (!artifact || !artifact.current_version) notFound();
  const demo = (await getProductMode()) === "demo";
  const query = searchParams ? await searchParams : {};
  const selectedProposal = query.proposal ? await getProposal(query.proposal) : artifact.current_proposal ? await getProposal(artifact.current_proposal.id) : null;
  const proposal = selectedProposal?.artifact_id === artifact.id ? selectedProposal : null;
  const reviewVersion = proposal?.candidate_version ?? artifact.current_version;
  const baselineVersion = proposal?.base_version ?? artifact.approved_version;
  const diff = buildLineDiff(baselineVersion?.content_snapshot ?? "", reviewVersion.content_snapshot);
  const sharing = getSharingStatusView(artifact);

  return (
    <div className="space-y-6">
      <header className="border-b border-border pb-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge variant="outline">{artifact.repo_name}</Badge>
          <Badge variant="outline">{artifact.path}</Badge>
        </div>
        <h1 className="text-3xl font-black">Review {artifact.name}</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">Compare the pending proposal with the published version, check the trust notes, and decide whether teammates should receive it.</p>
        {proposal ? <div className="mt-4 flex flex-wrap gap-2"><Badge variant="risk">{proposal.kind === "update" ? "Pending update" : "New skill proposal"}</Badge><Badge variant="outline">Submitted {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(proposal.created_at))}</Badge>{proposal.submitter_email ? <Badge variant="outline">{proposal.submitter_email}</Badge> : null}</div> : <div className="mt-4 rounded-md border border-border bg-panel p-3 text-sm text-muted-foreground">No first-class pending proposal is attached to this version. This may be legacy or demo data.</div>}
      </header>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(24rem,0.88fr)]">
        <div className="min-w-0 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            <Interpretation title="What changed?" body={reviewVersion.summary ?? "The proposed copy differs from the published shared version."} />
            <Interpretation title="Why preserve it?" body="Publishing keeps this team improvement from being lost in local copies or repo-specific edits." />
            <Interpretation title="Publish recommendation" body={getPublishRecommendation(artifact)} />
          </div>
          <div className="rounded-md border border-border bg-panel p-5">
            <h2 className="font-black">Current Change</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              {reviewVersion.summary ?? sharing.description}
            </p>
          </div>
          <div className="rounded-md border border-border bg-panel p-5">
            <h2 className="font-black">Version Integrity</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Comparing the proposed copy hash against the published shared version hash.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Hash label={proposal ? "Pending proposal" : "Current copy"} value={reviewVersion.content_hash} />
              <Hash label="Published version" value={baselineVersion?.content_hash ?? "None"} />
            </div>
          </div>
          <div className="rounded-md border border-border bg-panel p-5">
            <h2 className="font-black">Line Diff</h2>
            <pre className="mt-4 max-h-[360px] max-w-full overflow-auto rounded-md bg-muted p-4 text-xs leading-6">
              {diff.length ? diff.map((line, index) => <DiffLine key={`${line.kind}-${index}`} line={line} />) : "No published baseline yet."}
            </pre>
          </div>
          <div className="rounded-md border border-border bg-panel p-5">
            <h2 className="font-black">Proposed Content</h2>
            <pre className="mt-4 max-h-[520px] max-w-full overflow-auto rounded-md bg-muted p-4 text-xs leading-6">{reviewVersion.content_snapshot}</pre>
          </div>
          {proposal?.reviews?.length ? <div className="rounded-md border border-border bg-panel p-5"><h2 className="font-black">Review history</h2><div className="mt-4 space-y-3">{proposal.reviews.map((review) => <div key={review.id} className="rounded-sm border border-border bg-background p-3"><div className="flex flex-wrap justify-between gap-2 text-sm font-bold"><span>{review.decision === "published" ? "Published" : review.decision === "changes_requested" ? "Changes requested" : "Rejected"}</span><span className="text-xs font-normal text-muted-foreground">{review.reviewer_name} · {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(review.created_at))}</span></div>{review.note ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{review.note}</p> : null}</div>)}</div></div> : null}
        </div>
        <aside className="min-w-0 space-y-4">
          <div className="rounded-md border border-border bg-panel p-5">
            <h2 className="font-black">Compatibility and Trust Signals</h2>
            <div className="mt-4 space-y-3">
              {artifact.risks.map((risk) => (
                <div key={risk.id} className="rounded-sm border border-amber-500/30 bg-amber-500/10 p-3">
                  <div className="text-sm font-bold">{risk.kind.replaceAll("_", " ")}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{risk.message}</p>
                  {risk.evidence ? <code className="mt-2 block text-xs">{risk.evidence}</code> : null}
                </div>
              ))}
              {!artifact.risks.length ? <p className="text-sm text-muted-foreground">No trust notes detected.</p> : null}
            </div>
          </div>
          {proposal ? <ReviewActions artifactId={artifact.id} versionId={reviewVersion.id} proposalId={proposal.id} proposalStatus={proposal.status} canPublish={Boolean(artifact.can_publish)} /> : demo && artifact.can_publish ? <ReviewActions artifactId={artifact.id} versionId={reviewVersion.id} canPublish={true} /> : null}
        </aside>
      </section>
    </div>
  );
}

function Interpretation({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-border bg-panel p-4">
      <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{title}</div>
      <p className="mt-3 text-sm leading-6">{body}</p>
    </div>
  );
}

function buildLineDiff(previous: string, current: string) {
  if (!previous) return [];
  const previousLines = previous.split("\n");
  const currentLines = current.split("\n");
  const rows: Array<{ kind: "same" | "added" | "removed"; value: string }> = [];
  const max = Math.max(previousLines.length, currentLines.length);

  for (let index = 0; index < max; index += 1) {
    const before = previousLines[index];
    const after = currentLines[index];
    if (before === after && before !== undefined) {
      rows.push({ kind: "same", value: before });
    } else {
      if (before !== undefined) rows.push({ kind: "removed", value: before });
      if (after !== undefined) rows.push({ kind: "added", value: after });
    }
  }

  return rows;
}

function DiffLine({ line }: { line: { kind: "same" | "added" | "removed"; value: string } }) {
  const prefix = line.kind === "added" ? "+ " : line.kind === "removed" ? "- " : "  ";
  const color = line.kind === "added" ? "text-emerald-700" : line.kind === "removed" ? "text-red-700" : "text-muted-foreground";
  return <span className={`block ${color}`}>{prefix}{line.value || " "}</span>;
}

function Hash({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border bg-background p-3">
      <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <code className="mt-2 block truncate text-xs">{value}</code>
    </div>
  );
}
