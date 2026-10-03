import { Terminal } from "lucide-react";
import { SettingsForm } from "@/components/settings-form";
import { getSettings } from "@/lib/settings";

export default async function RepoSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-black">Import settings</h1>
        <p className="mt-2 text-muted-foreground">Choose where Skill Dockyard looks when you import skills from a connected computer.</p>
      </header>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(24rem,0.88fr)]">
        <div className="min-w-0"><SettingsForm {...settings} /></div>
        <div className="min-w-0 rounded-md border border-border bg-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            <h2 className="font-black">Skill Dockyard command</h2>
          </div>
          <pre className="max-w-full overflow-auto rounded-md bg-muted p-4 text-xs">npm run cli -- scan --repo ../skill-dockyard-example-repo --json</pre>
        </div>
      </section>
    </div>
  );
}
