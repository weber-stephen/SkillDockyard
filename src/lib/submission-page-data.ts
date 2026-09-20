import { getArtifactDetail, listArtifacts } from "@/lib/data";
import { getProductMode } from "@/lib/product-mode";
import { deriveSubmissionOptions } from "@/lib/submission-options";
import { getSettings } from "@/lib/settings";

export async function getSubmissionPageData() {
  const artifacts = await listArtifacts();
  const [settings, details] = await Promise.all([
    getSettings(),
    Promise.all(artifacts.map((artifact) => getArtifactDetail(artifact.id)))
  ]);

  return {
    artifacts,
    details: details.filter((detail): detail is NonNullable<typeof detail> => Boolean(detail)),
    options: deriveSubmissionOptions(artifacts, details, {
      highImpactTools: settings.highImpactTools,
      approvedMcpServers: settings.approvedMcpServers
    }),
    isDemo: (await getProductMode()) === "demo"
  };
}

export type SubmissionPageData = Awaited<ReturnType<typeof getSubmissionPageData>>;
