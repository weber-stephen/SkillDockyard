import { notFound, redirect } from "next/navigation";
import { DashboardPage } from "@/components/dashboard-page";
import ArtifactsPage from "@/app/artifacts/page";
import ArtifactPage from "@/app/artifacts/[id]/page";
import ReviewPage from "@/app/artifacts/[id]/review/page";
import SubmitPage from "@/app/submit/page";
import ExportsPage from "@/app/exports/page";
import GettingStartedPage from "@/app/getting-started/page";
import RepoSettingsPage from "@/app/settings/repos/page";
import RiskRulesPage from "@/app/settings/risk-rules/page";
import InvitesPage from "@/app/invites/page";
import SubmissionsPage from "@/app/submissions/page";
import ReviewQueuePage from "@/app/review-queue/page";
import NotificationsPage from "@/app/notifications/page";
import { getProductMode } from "@/lib/product-mode";
import UpdateSkillPage from "@/app/submit/update/page";
import ArtifactUpdatePage from "@/app/artifacts/[id]/update/page";
import SettingsPage from "@/app/settings/page";

export default async function AppRoute({ params, searchParams }: { params: Promise<{ path?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) { const path = (await params).path ?? []; const query = await searchParams; if (!path.length) return <DashboardPage />; if (path[0] === "artifacts" && path[2] === "update") return <ArtifactUpdatePage params={Promise.resolve({ id: path[1] })} />; if (path[0] === "artifacts" && path[2] === "review") return <ReviewPage params={Promise.resolve({ id: path[1] })} />; if (path[0] === "artifacts" && path.length === 1) return <ArtifactsPage />; if (path[0] === "artifacts" && path.length === 2) return <ArtifactPage params={Promise.resolve({ id: path[1] })} />; if (path[0] === "submit" && path[1] === "update") return <UpdateSkillPage initialArtifactId={typeof query.artifact === "string" ? query.artifact : undefined} />; if (path[0] === "submit" && path.length === 1) { if (typeof query.artifact === "string") { const prefix = (await getProductMode()) === "demo" ? "/demo" : "/app"; redirect(`${prefix}/artifacts/${query.artifact}/update` as never); } return <SubmitPage />; } if (path[0] === "submissions" && path.length === 1) return <SubmissionsPage />; if (path[0] === "review-queue" && path.length === 1) return <ReviewQueuePage />; if (path[0] === "notifications" && path.length === 1) return <NotificationsPage />; if (path[0] === "invites" && path.length === 1) return <InvitesPage />; if (path[0] === "exports" && path.length === 1) return <ExportsPage />; if (path[0] === "getting-started" && path.length === 1) return <GettingStartedPage />; if (path[0] === "settings" && path.length === 1) return <SettingsPage />; if (path[0] === "settings" && path[1] === "repos") return <RepoSettingsPage />; if (path[0] === "settings" && path[1] === "risk-rules") return <RiskRulesPage />; notFound(); }
