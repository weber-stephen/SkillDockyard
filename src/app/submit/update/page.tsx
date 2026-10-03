import { UpdateSkillContent } from "@/components/update-skill-page";

export default async function UpdateSkillPage({ searchParams }: { searchParams: Promise<{ artifact?: string }> }) {
  return <UpdateSkillContent initialArtifactId={(await searchParams).artifact} />;
}
