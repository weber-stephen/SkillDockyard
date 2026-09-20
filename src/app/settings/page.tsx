import { ArrowRight, FileSearch, ShieldCheck } from "lucide-react";
import { ProductLink as Link } from "@/components/product-link";
import { Badge } from "@/components/ui/badge";
import { getWorkspaceAdminData } from "@/lib/workspace-admin";
import { WorkspaceAdminPanel } from "@/components/workspace-admin-panel";
import { ConnectedCliPanel } from "@/components/connected-cli-panel";

export default async function SettingsPage() {
  const admin = await getWorkspaceAdminData();
  return (
    <div className="space-y-6">
      <header className="border-b border-border pb-6">
        <Badge variant="outline">Administration</Badge>
        <h1 className="mt-3 text-3xl font-black">Workspace settings</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Configure how Skill Dockyard scans, evaluates, and prepares skills for review.</p>
      </header>
      {admin ? <WorkspaceAdminPanel workspace={admin.workspace} members={admin.members} invites={admin.invites} isOwner={admin.isOwner} consistent={admin.consistent} /> : null}
      <ConnectedCliPanel />
      <section className="grid gap-4 md:grid-cols-2" aria-label="Workspace settings areas">
        <SettingsCard href="/settings/repos" icon={FileSearch} title="Repository and scanner" body="Choose the repository inputs and scanner configuration used to find skills and local improvements." />
        <SettingsCard href="/settings/risk-rules" icon={ShieldCheck} title="Trust rules" body="Review allowed connectors and high-impact tools used during compatibility checks." />
      </section>
    </div>
  );
}

function SettingsCard({ href, icon: Icon, title, body }: { href: string; icon: typeof FileSearch; title: string; body: string }) {
  return <Link href={href} className="group block border border-border bg-panel p-5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><div className="flex items-center justify-between"><Icon className="h-5 w-5 text-primary" /><ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" /></div><h2 className="mt-8 text-xl font-black">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></Link>;
}
