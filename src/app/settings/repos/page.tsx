import { Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RepoSettingsPage() {
  return (
    <div className="space-y-6">
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-black">Repo Settings</h1>
        <p className="mt-2 text-muted-foreground">MVP repo registration lives in `skill-dockyard.yml` and the oclif scanner.</p>
      </header>
      <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-md border border-border bg-panel p-5">
          <h2 className="font-black">Local Config Preview</h2>
          <div className="mt-4 grid gap-3">
            <Input readOnly value="./tests/fixtures/sample-repo" />
            <Input readOnly value="**/AGENTS.md, **/SKILL.md, .github/agents/*.md" />
            <Button variant="outline">Save in Supabase later</Button>
          </div>
        </div>
        <div className="rounded-md border border-border bg-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            <h2 className="font-black">Scanner Command</h2>
          </div>
          <pre className="overflow-auto rounded-md bg-muted p-4 text-xs">npm run cli -- scan --repo ./tests/fixtures/sample-repo --json</pre>
        </div>
      </section>
    </div>
  );
}
