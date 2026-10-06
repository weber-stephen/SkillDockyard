import { redirect } from "next/navigation";
import { LegalAcceptanceForm } from "@/components/legal-acceptance-form";
import { hasCurrentLegalAcceptance } from "@/lib/legal-acceptance";
import { safeLocalPath } from "@/lib/safe-redirect";
import { getCurrentUser } from "@/lib/supabase/auth";

export default async function LegalAcceptancePage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login" as never);
  const params = await searchParams;
  const nextPath = safeLocalPath(Array.isArray(params.next) ? params.next[0] : params.next);
  if (await hasCurrentLegalAcceptance(user.id)) redirect(nextPath as never);
  return <LegalAcceptanceForm nextPath={nextPath} />;
}
