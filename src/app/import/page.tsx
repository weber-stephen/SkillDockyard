import { Badge } from "@/components/ui/badge";
import { SkillImporter } from "@/components/skill-importer";
import { getProductMode } from "@/lib/product-mode";

export default async function ImportSkillsPage() {
  const isDemo = (await getProductMode()) === "demo";
  return <div className="space-y-7"><header className="border-b border-border pb-7"><Badge variant="outline">Import skills</Badge><h1 className="mt-3 text-3xl font-black sm:text-4xl">Bring skills in from your computer.</h1><p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Choose a folder or ZIP, review the skills we find, and decide what belongs in your private library or workspace review queue.</p></header><SkillImporter isDemo={isDemo} /></div>;
}
