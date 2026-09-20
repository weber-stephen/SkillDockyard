import Link from "next/link";
import { Anchor, ArrowDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const workflowSteps = [
  {
    title: "Save what works",
    body: "Capture a useful AI instruction or an improvement someone discovered."
  },
  {
    title: "Review the change",
    body: "Compare the proposed version with the one your team already uses."
  },
  {
    title: "Share the approved version",
    body: "Once approved, teammates can find and reuse the trusted version."
  }
] as const;

const audiences = [
  {
    label: "For team members",
    title: "Improve the work without losing the improvement.",
    body: "Save a better instruction when you find one instead of leaving it in a chat, document, or private copy."
  },
  {
    label: "For reviewers",
    title: "See exactly what changed before it becomes official.",
    body: "Compare the proposed workflow with the approved version and decide what the team should use next."
  },
  {
    label: "For organizations",
    title: "Give people one dependable place to start.",
    body: "Keep access, ownership, proposals, and publishing decisions clear as more people contribute."
  }
] as const;

const trustPoints = [
  "Personal drafts stay private until their creator submits them for review.",
  "Proposed updates never publish automatically.",
  "Sharing access never transfers ownership."
] as const;

export default function MarketingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-50 rounded-sm bg-primary px-4 py-3 font-semibold text-primary-foreground focus:not-sr-only"
      >
        Skip to content
      </a>

      <SiteHeader />

      <main id="main-content">
        <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-24 pt-14 sm:px-8 sm:pb-28 sm:pt-20 lg:grid-cols-[minmax(0,1.04fr)_minmax(22rem,0.96fr)] lg:items-end lg:gap-16 lg:pb-36 lg:pt-28">
          <div className="min-w-0">
            <p className="max-w-xl text-xs font-bold uppercase tracking-[0.18em] text-primary">
              A shared home for your team’s AI workflows
            </p>
            <h1 className="mt-6 max-w-[12ch] text-balance font-display text-[clamp(2.25rem,7vw,4.75rem)] font-bold leading-[0.94] tracking-[-0.035em]">
              Keep your team’s best AI instructions current and easy to reuse.
            </h1>
            <p className="mt-7 max-w-[62ch] text-pretty text-lg leading-8 text-muted-foreground sm:text-xl sm:leading-9">
              When someone improves an AI workflow, Skill Dockyard gives your organization one private place to review the change, approve it, and share the trusted version.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild className="min-h-11 w-full sm:w-auto">
                <a href="#how-it-works">
                  See how it works
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </a>
              </Button>
              <Button asChild variant="outline" className="min-h-11 w-full bg-panel/70 sm:w-auto">
                <a href="/demo">
                  Explore the demo
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </Button>
            </div>
          </div>

          <RevisionSheet />
        </section>

        <WorkflowSection />
        <AudienceSection />
        <TrustSection />
        <ClosingCallToAction />
      </main>

      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="border-b border-border/80 bg-background/85">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-8">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <Link href="/" className="flex min-h-11 min-w-0 items-center gap-2 font-bold tracking-[-0.01em] sm:gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-primary text-primary-foreground">
              <Anchor className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="truncate text-[13px] sm:text-lg">Skill Dockyard</span>
          </Link>
          <Button asChild className="min-h-11 shrink-0 px-3 text-[13px] sm:hidden">
            <Link href="/signup">Create account</Link>
          </Button>
        </div>

        <nav aria-label="Primary" className="grid w-full grid-cols-3 gap-1 border-t border-border/70 pt-2 sm:flex sm:w-auto sm:items-center sm:gap-1 sm:border-0 sm:pt-0">
          <a className="inline-flex min-h-11 items-center justify-center px-1 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-2 sm:text-sm" href="#how-it-works">
            How it works
          </a>
          <a className="inline-flex min-h-11 items-center justify-center px-2 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm" href="/demo">
            Demo
          </a>
          <Link className="inline-flex min-h-11 items-center justify-center px-1 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-2 sm:text-sm" href="/login">
            Log in
          </Link>
          <Button asChild className="ml-2 hidden min-h-11 sm:inline-flex">
            <Link href="/signup">Create account</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

function RevisionSheet() {
  return (
    <article className="min-w-0 border border-border bg-panel" aria-labelledby="example-workflow-title">
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Example workflow</p>
          <h2 id="example-workflow-title" className="mt-2 font-display text-2xl font-bold tracking-[-0.02em]">
            Campaign Brief Builder
          </h2>
        </div>
        <span className="w-fit border border-primary/30 bg-primary/[0.06] px-3 py-1.5 text-xs font-bold text-primary">
          Waiting for review
        </span>
      </div>

      <div className="grid md:grid-cols-2">
        <div className="border-b border-border p-5 sm:p-6 md:border-b-0 md:border-r">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Approved version</p>
          <p className="mt-4 text-base font-semibold leading-7">Creates an audience, message, and channel plan.</p>
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Proposed improvement</p>
          <p className="mt-4 text-base font-semibold leading-7">Adds customer language, message variations, and a sales handoff.</p>
        </div>
      </div>

      <p className="border-t border-border bg-secondary/45 p-5 text-sm leading-6 text-secondary-foreground sm:px-6">
        The approved version stays in use until a reviewer accepts the change.
      </p>
    </article>
  );
}

function WorkflowSection() {
  return (
    <section id="how-it-works" className="scroll-mt-6 border-y border-border bg-panel/65">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">How it works</p>
            <h2 className="mt-4 max-w-[12ch] text-balance font-display text-4xl font-bold leading-[1] tracking-[-0.025em] sm:text-5xl">
              A clear path from useful idea to trusted workflow.
            </h2>
          </div>

          <ol className="border-t border-border">
            {workflowSteps.map((step, index) => (
              <li key={step.title} className="grid gap-4 border-b border-border py-6 sm:grid-cols-[4rem_0.72fr_1fr] sm:items-baseline sm:gap-6 sm:py-7">
                <span className="font-display text-2xl font-bold tabular-nums text-primary" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-bold">{step.title}</h3>
                <p className="max-w-[48ch] text-pretty leading-7 text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function AudienceSection() {
  return (
    <section id="who-its-for" className="scroll-mt-6 bg-secondary/55">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Built for shared AI work</p>
          <h2 className="mt-4 text-balance font-display text-4xl font-bold leading-[1] tracking-[-0.025em] sm:text-5xl">
            One dependable place for the people who create, review, and reuse AI workflows.
          </h2>
        </div>

        <div className="mt-12 border-t border-secondary-foreground/20">
          {audiences.map((audience) => (
            <article key={audience.label} className="grid gap-3 border-b border-secondary-foreground/20 py-7 md:grid-cols-[0.58fr_1fr_1fr] md:gap-8">
              <p className="text-sm font-bold text-primary">{audience.label}</p>
              <h3 className="max-w-[26ch] text-balance text-xl font-bold leading-7">{audience.title}</h3>
              <p className="max-w-[48ch] text-pretty leading-7 text-secondary-foreground/80">{audience.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section id="trust" className="scroll-mt-6 border-y border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Deliberate by design</p>
          <h2 className="mt-4 max-w-[13ch] text-balance font-display text-4xl font-bold leading-[1] tracking-[-0.025em] sm:text-5xl">
            Better workflows move forward. Ownership stays put.
          </h2>
          <p className="mt-6 max-w-[52ch] text-pretty text-lg leading-8 text-muted-foreground">
            Skill Dockyard separates suggestions from approved work, so collaboration never quietly changes what the team relies on.
          </p>
        </div>

        <ul className="border-t border-border">
          {trustPoints.map((point, index) => (
            <li key={point} className="grid grid-cols-[3rem_1fr] gap-4 border-b border-border py-6 sm:grid-cols-[4rem_1fr] sm:py-7">
              <span className="font-display text-xl font-bold tabular-nums text-primary" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="max-w-[52ch] text-pretty text-lg font-semibold leading-8">{point}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ClosingCallToAction() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="grid gap-8 border border-primary/25 bg-primary/[0.055] p-6 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-end lg:p-12">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Start with the product</p>
          <h2 className="mt-4 max-w-[17ch] text-balance font-display text-4xl font-bold leading-[1] tracking-[-0.025em] sm:text-5xl">
            Give your team one trusted version to build from.
          </h2>
          <p className="mt-5 max-w-[58ch] text-pretty text-lg leading-8 text-muted-foreground">
            Explore the product with sample data, or create a private workspace when you are ready.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
          <Button asChild className="min-h-11 w-full sm:w-auto">
            <a href="/demo">
              Explore the demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
          <Button asChild variant="outline" className="min-h-11 w-full bg-background/70 sm:w-auto">
            <Link href="/signup">Create account</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-panel/75">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="max-w-md">
          <p className="font-display text-lg font-bold">Skill Dockyard</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">A shared home for the AI workflows your team wants to trust and reuse.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
          <a className="inline-flex min-h-11 items-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/demo">Demo</a>
          <Link className="inline-flex min-h-11 items-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/login">Log in</Link>
          <Link className="inline-flex min-h-11 items-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/signup">Create account</Link>
        </nav>
      </div>
    </footer>
  );
}
