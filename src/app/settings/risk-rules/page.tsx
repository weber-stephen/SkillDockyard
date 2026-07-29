import { Badge } from "@/components/ui/badge";
import { getSettings } from "@/lib/settings";

export default async function RiskRulesPage() {
  const settings = await getSettings();
  return (
    <div className="space-y-6">
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-black">Risk Rules</h1>
        <p className="mt-2 text-muted-foreground">Deterministic checks remain authoritative even when AI summaries are added.</p>
      </header>
      <section className="grid gap-4 md:grid-cols-2">
        <RulePanel title="Approved MCP Servers" items={settings.approvedMcpServers} />
        <RulePanel title="High-Impact Tools" items={settings.highImpactTools} />
      </section>
    </div>
  );
}

function RulePanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-border bg-panel p-5">
      <h2 className="mb-4 font-black">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => <Badge key={item} variant="secondary">{item}</Badge>)}
      </div>
    </div>
  );
}
