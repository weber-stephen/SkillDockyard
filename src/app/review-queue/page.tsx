import { Badge } from "@/components/ui/badge";
import { ProposalTable } from "@/components/proposal-table";
import { listReviewQueue } from "@/lib/proposals";
import { getProductMode } from "@/lib/product-mode";

export default async function ReviewQueuePage() {
  if ((await getProductMode()) === "demo") return <div className="space-y-6"><header className="border-b border-border pb-6"><Badge variant="muted">Demo mode</Badge><h1 className="mt-3 text-3xl font-black">Submissions to review</h1><p className="mt-2 text-muted-foreground">The demo shows comparison screens, but does not create shared submissions.</p></header><ProposalTable proposals={[]} reviewQueue /></div>;
  const proposals = await listReviewQueue();
  return <div className="space-y-6"><header className="border-b border-border pb-6"><Badge variant="risk">Owner and reviewer view</Badge><h1 className="mt-3 text-3xl font-black">Submissions to review</h1><p className="mt-2 max-w-2xl text-muted-foreground">Review pending submissions from your source workspaces. Publishing changes what teammates receive; requesting changes or rejecting a submission keeps the published version active.</p></header><ProposalTable proposals={proposals} reviewQueue /></div>;
}
