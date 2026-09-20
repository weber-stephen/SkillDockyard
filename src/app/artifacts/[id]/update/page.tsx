import { notFound } from "next/navigation";
import { ProductLink as Link } from "@/components/product-link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getArtifactDetail } from "@/lib/data";
import UpdateSkillPage from "@/app/submit/update/page";

export default async function ArtifactUpdatePage({ params }: { params: Promise<{ id: string }> }) {
  const artifact = await getArtifactDetail((await params).id);
  if (!artifact) notFound();
  if (!artifact.can_propose_update) {
    return <section className="mx-auto max-w-2xl border border-border bg-panel p-8"><h1 className="text-2xl font-black">You cannot propose an update here.</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">This skill is available to view, compare, and download, but your current access does not include proposal rights.</p><Button asChild variant="outline" className="mt-6"><Link href={`/artifacts/${artifact.id}`}><ArrowLeft className="h-4 w-4" />Back to skill</Link></Button></section>;
  }
  return <UpdateSkillPage initialArtifactId={artifact.id} />;
}
