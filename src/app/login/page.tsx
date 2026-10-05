import { AuthForm } from "@/components/auth-form";
import { safeLocalPath } from "@/lib/safe-redirect";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const params = await searchParams;
  const nextPath = safeLocalPath(Array.isArray(params.next) ? params.next[0] : params.next);
  return <AuthForm mode="login" nextPath={nextPath} />;
}
