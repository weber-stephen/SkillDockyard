import { Badge } from "@/components/ui/badge";
import { getSharingStatusView } from "@/lib/sharing";
import type { Artifact } from "@/lib/types";

export function StatusBadge({ artifact }: { artifact: Pick<Artifact, "status" | "current_version_id" | "approved_version_id"> }) {
  const view = getSharingStatusView(artifact);
  const variant = view.status === "published" ? "success" : view.status === "improvement_available" ? "risk" : "muted";
  return <Badge variant={variant}>{view.label}</Badge>;
}
