import { Badge } from "@/components/ui/badge";
import { ProposalTable } from "@/components/proposal-table";
import { listMyProposals } from "@/lib/proposals";
import { getProductMode } from "@/lib/product-mode";

export default async function SubmissionsPage() {
  if ((await getProductMode()) === "demo") return <DemoSubmissions />;
  const proposals = await listMyProposals();
  return <div className="space-y-6"><header className="border-b border-border pb-6"><Badge variant="outline">Submission history</Badge><h1 className="mt-3 text-3xl font-black">My submissions</h1><p className="mt-2 max-w-2xl text-muted-foreground">Track new skills and updates from submission through review and publication.</p></header><ProposalTable proposals={proposals} /></div>;
}

function DemoSubmissions() { return <div className="space-y-6"><header className="border-b border-border pb-6"><Badge variant="muted">Demo mode</Badge><h1 className="mt-3 text-3xl font-black">My submissions</h1><p className="mt-2 text-muted-foreground">Demo submissions stay in this browser and are not connected to a shared review queue.</p></header><ProposalTable proposals={[]} /></div>; }
