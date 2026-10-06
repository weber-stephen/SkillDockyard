import { createServerSupabase } from "@/lib/supabase/server";
import { CURRENT_LEGAL_DOCUMENTS } from "@/lib/legal-documents";

export async function hasCurrentLegalAcceptance(userId: string) {
  const { data, error } = await createServerSupabase()
    .from("legal_acceptances")
    .select("id")
    .eq("user_id", userId)
    .eq("terms_version", CURRENT_LEGAL_DOCUMENTS.termsVersion)
    .eq("privacy_version", CURRENT_LEGAL_DOCUMENTS.privacyVersion)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function recordCurrentLegalAcceptance(userId: string, source: "signup" | "reacceptance") {
  const { error } = await createServerSupabase().from("legal_acceptances").insert({
    user_id: userId,
    terms_version: CURRENT_LEGAL_DOCUMENTS.termsVersion,
    privacy_version: CURRENT_LEGAL_DOCUMENTS.privacyVersion,
    source
  });
  if (error) throw error;
}
