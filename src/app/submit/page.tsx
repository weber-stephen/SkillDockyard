import { ProductLink as Link } from "@/components/product-link";
import { ArrowRight, Library, Send } from "lucide-react";
import { SubmissionForm } from "@/components/submission-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSubmissionPageData } from "@/lib/submission-page-data";

export default async function SubmitPage() {
  const { artifacts, details, options, isDemo } = await getSubmissionPageData();

  return (
    <div className="space-y-8">
      <header className="grid gap-6 border-b border-border pb-8 lg:grid-cols-[1fr_0.48fr]">
        <div className="space-y-4">
          <Badge variant={isDemo ? "muted" : "success"}>{isDemo ? "Demo mode: try a submission" : "New skill submission"}</Badge>
          <div className="space-y-3">
            <h1 className="max-w-4xl text-4xl font-black leading-[0.95] tracking-normal sm:text-5xl">
              Add a new skill to the library.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Capture a reusable workflow, keep it private while it takes shape, or send it to your workspace review queue when it is ready.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/artifacts">
                Browse Skills
                <Library className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline"><Link href="/submit/update">Propose an update<ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
        </div>
        <section className="rounded-md border border-border bg-panel p-5">
          <div className="mb-5 flex items-center gap-2">
            <Send className="h-4 w-4" />
            <h2 className="font-black">New skill review</h2>
          </div>
          <div className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>Choose whether to save a private draft or submit a workspace skill for review.</p>
            <p>Workspace skills stay unpublished until an owner or reviewer explicitly approves them.</p>
            {isDemo ? <p>In the demo, drafts stay in this browser and are never sent to reviewers or teammates.</p> : null}
          </div>
        </section>
      </header>

      <section className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="space-y-4">
          <GuidanceCard
            title="What to paste"
            body="Use the full instructions you would give an AI assistant: role, steps, tools, boundaries, and examples. Do not paste private keys or passwords."
          />
          <GuidanceCard
            title="What to explain"
            body="Write one or two sentences about why this skill or update helps the team. Reviewers use this before looking at hashes or trust notes."
          />
        </aside>
        <SubmissionForm mode="new" artifacts={artifacts} artifactDetails={details} options={options} isDemo={isDemo} />
      </section>
    </div>
  );
}

function GuidanceCard({ title, body }: { title: string; body: string }) {
  return <section className="rounded-md border border-border bg-panel p-5"><h2 className="mb-5 font-black">{title}</h2><p className="text-sm leading-6 text-muted-foreground">{body}</p></section>;
}
