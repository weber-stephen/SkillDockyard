import { SetupHub } from "@/components/setup-hub";
import { listArtifacts } from "@/lib/data";
import { getOnboardingState } from "@/lib/onboarding";

export default async function GettingStartedPage() {
  const [artifacts, onboarding] = await Promise.all([listArtifacts(), getOnboardingState()]);
  return <SetupHub initialState={onboarding} hasArtifacts={artifacts.length > 0} artifactCount={artifacts.length} />;
}
