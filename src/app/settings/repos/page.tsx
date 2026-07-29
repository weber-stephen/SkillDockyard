import { Terminal } from "lucide-react";
import { SettingsForm } from "@/components/settings-form";
import { getSettings } from "@/lib/settings";

export default async function RepoSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-black">Repo Settings</h1>
        <p className="mt-2 text-muted-foreground">Configure the local scanner inputs used for prototype reviews.</p>
      </header>
      <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <SettingsForm {...settings} />
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
