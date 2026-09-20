import { ProductLink as Link } from "@/components/product-link";
import { ArrowRight, GitCompareArrows, Library } from "lucide-react";
import { SubmissionForm } from "@/components/submission-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSubmissionPageData } from "@/lib/submission-page-data";

export default async function UpdateSkillPage({ initialArtifactId }: { initialArtifactId?: string }) {
  const { artifacts, details, options, isDemo } = await getSubmissionPageData();
  const updateableCount = artifacts.filter((artifact) => artifact.can_propose_update).length;

  return (
    <div className="space-y-8">
      <header className="grid gap-6 border-b border-border pb-8 lg:grid-cols-[1fr_0.48fr]">
        <div className="space-y-4">
          <Badge variant={isDemo ? "muted" : "success"}>{isDemo ? "Demo mode: try an update" : "Proposed update"}</Badge>
          <div className="space-y-3">
            <h1 className="max-w-4xl text-4xl font-black leading-[0.95] tracking-normal sm:text-5xl">Propose an update to a skill.</h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">Choose a skill you can improve, start from its current content, and explain what should change. The published version stays active until approval.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline"><Link href="/artifacts">Browse Skills<Library className="h-4 w-4" /></Link></Button>
            <Button asChild variant="outline"><Link href="/submit">Add a new skill<ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
        </div>
        <section className="rounded-md border border-border bg-panel p-5">
          <div className="mb-5 flex items-center gap-2"><GitCompareArrows className="h-4 w-4" /><h2 className="font-black">Update review</h2></div>
          <div className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>{updateableCount ? `${updateableCount} skill${updateableCount === 1 ? " is" : "s are"} available for you to update.` : "No skills are currently available for you to update."}</p>
            <p>Owners and reviewers compare proposals before explicitly publishing them for teammates.</p>
            {isDemo ? <p>In the demo, drafts stay in this browser and are never sent to reviewers or teammates.</p> : null}
          </div>
        </section>
      </header>

      {updateableCount ? <SubmissionForm mode="update" artifacts={artifacts} artifactDetails={details} options={options} isDemo={isDemo} initialArtifactId={initialArtifactId} /> : <EmptyUpdateState />}
    </div>
  );
}

function EmptyUpdateState() {
  return <section className="border border-dashed border-border bg-panel p-8"><h2 className="text-xl font-black">No eligible skills yet</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">You can propose updates to skills you own, edit, review, or have received with proposal access. View-only skills cannot be updated.</p><div className="mt-5 flex flex-wrap gap-3"><Button asChild><Link href="/artifacts">Browse skills</Link></Button><Button asChild variant="outline"><Link href="/submit">Add a new skill</Link></Button></div></section>;
}
