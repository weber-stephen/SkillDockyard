import type { Artifact, ArtifactDetail, ArtifactStatus } from "@/lib/types";

export type SharingStatus = "published" | "improvement_available" | "new_skill" | "archived";

export interface SharingStatusView {
  status: SharingStatus;
  label: string;
  shortLabel: string;
  description: string;
}

const sharingViews: Record<SharingStatus, Omit<SharingStatusView, "status">> = {
  published: {
    label: "Published",
    shortLabel: "In sync",
    description: "This copy matches the shared version."
  },
  improvement_available: {
    label: "Improvement available",
    shortLabel: "Improvement",
    description: "This copy has changes that can be preserved for the team."
  },
  new_skill: {
    label: "New skill",
    shortLabel: "New",
    description: "This skill does not have a published shared version yet."
  },
  archived: {
    label: "Archived",
    shortLabel: "Archived",
    description: "This skill is no longer active in your library."
  }
};

export function getSharingStatus(artifact: Pick<Artifact, "status" | "current_version_id" | "approved_version_id">): SharingStatus {
  if (artifact.status === "deprecated") return "archived";
  if (!artifact.approved_version_id || artifact.status === "unreviewed") return "new_skill";
  if (artifact.status === "needs_reapproval" || artifact.current_version_id !== artifact.approved_version_id) return "improvement_available";
  return "published";
}

export function getSharingStatusView(artifact: Pick<Artifact, "status" | "current_version_id" | "approved_version_id">): SharingStatusView {
  const status = getSharingStatus(artifact);
  return { status, ...sharingViews[status] };
}

export function getPublishRecommendation(artifact: ArtifactDetail) {
  const status = getSharingStatus(artifact);
  if (status === "improvement_available") {
    return "Publish if the new capability and dependency notes are acceptable for teammates.";
  }
  if (status === "new_skill") {
    return "Publish when this should become part of your library.";
  }
  if (status === "archived") {
    return "Keep archived unless the team wants to restore this skill.";
  }
  return "No publish action is needed while the current copy matches the shared version.";
}

export function getSharingMetrics(artifacts: Artifact[]) {
  const sharedSkills = artifacts.filter((artifact) => artifact.status !== "deprecated").length;
  const improvementsAvailable = artifacts.filter((artifact) => getSharingStatus(artifact) === "improvement_available").length;
  const inSync = artifacts.filter((artifact) => getSharingStatus(artifact) === "published").length;
  const newSkills = artifacts.filter((artifact) => getSharingStatus(artifact) === "new_skill").length;

  return {
    sharedSkills,
    improvementsAvailable,
    inSync,
    newSkills
  };
}

export function mapArtifactStatusToSharingLabel(status: ArtifactStatus) {
  const labels: Record<ArtifactStatus, string> = {
    approved: "Published",
    deprecated: "Archived",
    needs_reapproval: "Improvement available",
    unreviewed: "New skill"
  };
  return labels[status];
}
