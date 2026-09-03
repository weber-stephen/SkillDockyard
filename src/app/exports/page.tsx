import { FileDown } from "lucide-react";
import { getProductMode } from "@/lib/product-mode";
import { Button } from "@/components/ui/button";

export default async function ExportsPage() {
  const demo = (await getProductMode()) === "demo";
  return (
    <div className="space-y-6">
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-black">Exports</h1>
        <p className="mt-2 text-muted-foreground">Download skill inventory data for platform and security review.</p>
      </header>
      <section className="rounded-md border border-border bg-panel p-5">
        <div className="mb-6 flex items-center gap-2">
          <FileDown className="h-4 w-4" />
          <h2 className="font-black">Skill Inventory Export</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <a href={`/api/export?format=json${demo ? "&demo=1" : ""}`}>Download JSON</a>
          </Button>
          <Button asChild variant="outline">
            <a href={`/api/export?format=csv${demo ? "&demo=1" : ""}`}>Download CSV</a>
          </Button>
        </div>
      </section>
    </div>
  );
}
