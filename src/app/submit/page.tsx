import { ProductLink as Link } from "@/components/product-link";
import { ArrowRight, ClipboardEdit, GitCompareArrows, Library, Send } from "lucide-react";
import { SubmissionForm } from "@/components/submission-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getArtifactDetail, listArtifacts } from "@/lib/data";
import { getSettings } from "@/lib/settings";
import { deriveSubmissionOptions } from "@/lib/submission-options";
import { getProductMode } from "@/lib/product-mode";

export default async function SubmitPage() {
  const artifacts = await listArtifacts();
  const [settings, details] = await Promise.all([getSettings(), Promise.all(artifacts.map((artifact) => getArtifactDetail(artifact.id)))]);
  const options = deriveSubmissionOptions(artifacts, details, {
    highImpactTools: settings.highImpactTools,
    approvedMcpServers: settings.approvedMcpServers
  });
  const demo = (await getProductMode()) === "demo";
  const mode = demo ? "Demo mode: submissions save in this browser" : "Submissions save to your workspace";

  return (
    <div className="space-y-8">
      <header className="grid gap-6 border-b border-border pb-8 lg:grid-cols-[1fr_0.48fr]">
        <div className="space-y-4">
          <Badge variant={demo ? "muted" : "success"}>{mode}</Badge>
          <div className="space-y-3">
            <h1 className="max-w-4xl text-4xl font-black leading-[0.95] tracking-normal sm:text-5xl">
              Submit a skill without opening Git.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Paste the instructions teammates should receive, describe what improved, and Skill Dockyard will prepare it for compare and publish.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/artifacts">
                Browse Skills
                <Library className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/getting-started">
                Read Guide
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        <section className="rounded-md border border-border bg-panel p-5">
          <div className="mb-5 flex items-center gap-2">
            <Send className="h-4 w-4" />
            <h2 className="font-black">What happens next</h2>
          </div>
          <div className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>New skills become proposals in your private library.</p>
            <p>Updates become the current copy for an existing skill, ready to compare against the published version.</p>
            {demo ? <p>In demo mode, drafts stay in this browser and never affect another workspace.</p> : null}
            <p>Publishing still records the exact content hash so teammates receive the same skill.</p>
          </div>
        </section>
      </header>

      <section className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="space-y-4">
          <GuidanceCard
            icon={<ClipboardEdit className="h-4 w-4" />}
            title="What to paste"
            body="Use the full instructions you would give an AI assistant: role, steps, tools, boundaries, and examples. Do not paste private keys or passwords."
          />
          <GuidanceCard
            icon={<GitCompareArrows className="h-4 w-4" />}
            title="What to explain"
            body="Write one or two sentences about why this skill or update helps the team. Reviewers use this before looking at hashes or trust notes."
          />
        </aside>
        <SubmissionForm artifacts={artifacts} options={options} supabaseConfigured={!demo} />
      </section>
    </div>
  );
}

function GuidanceCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <section className="rounded-md border border-border bg-panel p-5">
      <div className="mb-5 flex items-center gap-2">
        {icon}
        <h2 className="font-black">{title}</h2>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{body}</p>
    </section>
  );
}
