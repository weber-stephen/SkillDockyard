import { ArtifactTable } from "@/components/artifact-table";
import { listArtifacts } from "@/lib/data";

export default async function ArtifactsPage() {
  const artifacts = await listArtifacts();

  return (
    <div className="space-y-6">
      <header className="border-b border-border pb-7">
        <h1 className="app-page-title">Skills</h1>
        <p className="app-copy mt-3 text-muted-foreground">Browse skills you created, workspace skills, and skills shared with you.</p>
      </header>
      <ArtifactTable artifacts={artifacts} />
    </div>
  );
}
