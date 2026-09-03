import { InviteInbox } from "@/components/invite-inbox";
import { getPendingInvites } from "@/lib/shares";

export default async function InvitesPage() {
  const invites = await getPendingInvites();

  return (
    <div className="space-y-6">
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-black">Share Invites</h1>
        <p className="mt-2 text-muted-foreground">Review pending skill shares before they appear in your library.</p>
      </header>
      <InviteInbox invites={invites} />
    </div>
  );
}
