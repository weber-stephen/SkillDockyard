import { ArtifactTable } from "@/components/artifact-table";
import { listArtifacts } from "@/lib/data";

export default async function ArtifactsPage() {
  const artifacts = await listArtifacts();

  return (
    <div className="space-y-6">
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-black">Artifacts</h1>
        <p className="mt-2 text-muted-foreground">Search and filter everything discovered by the local scanner.</p>
      </header>
      <ArtifactTable artifacts={artifacts} />
    </div>
  );
}
