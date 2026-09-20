import { InviteInbox } from "@/components/invite-inbox";
import { getPendingInvites } from "@/lib/shares";
import { getProductMode } from "@/lib/product-mode";
import { getPendingWorkspaceInvites } from "@/lib/workspace-admin";
import { WorkspaceInviteInbox } from "@/components/workspace-invite-inbox";

export default async function InvitesPage() {
  const demo = (await getProductMode()) === "demo";
  const invites = demo ? [] : await getPendingInvites();
  const workspaceInvites = demo ? [] : await getPendingWorkspaceInvites();

  return (
    <div className="space-y-6">
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-black">Invitations</h1>
        <p className="mt-2 text-muted-foreground">Workspace invitations and skill shares are managed separately.</p>
      </header>
      <WorkspaceInviteInbox invites={workspaceInvites} />
      {invites.length ? <section className="space-y-4"><h2 className="text-xl font-black">Skill share invites</h2><InviteInbox invites={invites} /></section> : null}
      {!workspaceInvites.length && !invites.length ? <section className="rounded-md border border-border bg-panel p-5 text-sm text-muted-foreground">No pending invitations right now.</section> : null}
    </div>
  );
}
