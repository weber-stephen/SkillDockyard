import { notFound } from "next/navigation";
import { DashboardPage } from "@/components/dashboard-page";
import ArtifactsPage from "@/app/artifacts/page";
import ArtifactPage from "@/app/artifacts/[id]/page";
import ReviewPage from "@/app/artifacts/[id]/review/page";
import SubmitPage from "@/app/submit/page";
import ExportsPage from "@/app/exports/page";
import GettingStartedPage from "@/app/getting-started/page";
import RepoSettingsPage from "@/app/settings/repos/page";
import RiskRulesPage from "@/app/settings/risk-rules/page";

export default async function AppRoute({ params }: { params: Promise<{ path?: string[] }> }) { const path = (await params).path ?? []; if (!path.length) return <DashboardPage />; if (path[0] === "artifacts" && path.length === 1) return <ArtifactsPage />; if (path[0] === "artifacts" && path.length === 2) return <ArtifactPage params={Promise.resolve({ id: path[1] })} />; if (path[0] === "artifacts" && path[2] === "review") return <ReviewPage params={Promise.resolve({ id: path[1] })} />; if (path[0] === "submit" && path.length === 1) return <SubmitPage />; if (path[0] === "exports" && path.length === 1) return <ExportsPage />; if (path[0] === "getting-started" && path.length === 1) return <GettingStartedPage />; if (path[0] === "settings" && path[1] === "repos") return <RepoSettingsPage />; if (path[0] === "settings" && path[1] === "risk-rules") return <RiskRulesPage />; notFound(); }
