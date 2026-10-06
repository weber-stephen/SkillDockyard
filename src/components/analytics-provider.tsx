"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  analyticsConsentStorageKey,
  campaignParameters,
  isValidGtmContainerId,
  routeCategory,
  setAnalyticsEnabled,
  trackAnalyticsEvent,
  type AnalyticsConsent,
  type AnalyticsEventName
} from "@/lib/analytics";

const openPreferencesEvent = "skill-dockyard:open-analytics-preferences";

function setGoogleConsent(consent: AnalyticsConsent) {
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(["consent", consent === "granted" ? "update" : "default", {
    analytics_storage: consent,
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied"
  }]);
}

function startGtm(containerId: string) {
  if (document.getElementById("skill-dockyard-gtm")) return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  const script = document.createElement("script");
  script.id = "skill-dockyard-gtm";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`;
  document.head.appendChild(script);
}

export function AnalyticsProvider({ containerId }: { containerId?: string }) {
  const pathname = usePathname();
  const [consent, setConsent] = useState<AnalyticsConsent | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const demoTracked = useRef(false);
  const enabled = isValidGtmContainerId(containerId);

  useEffect(() => {
    const saved = window.localStorage.getItem(analyticsConsentStorageKey);
    if (saved === "granted" || saved === "denied") setConsent(saved);
    else setPreferencesOpen(enabled);
  }, [enabled]);

  useEffect(() => {
    const open = () => setPreferencesOpen(true);
    window.addEventListener(openPreferencesEvent, open);
    return () => window.removeEventListener(openPreferencesEvent, open);
  }, []);

  useEffect(() => {
    if (!enabled || consent !== "granted") {
      setAnalyticsEnabled(false);
      if (consent === "denied" && window.dataLayer) setGoogleConsent("denied");
      return;
    }
    setGoogleConsent("granted");
    startGtm(containerId!);
    setAnalyticsEnabled(true);
  }, [consent, containerId, enabled]);

  useEffect(() => {
    if (!enabled || consent !== "granted") return;
    trackAnalyticsEvent("page_view", {
      route_category: routeCategory(pathname),
      ...campaignParameters(window.location.search)
    });
    if (pathname === "/demo" && !demoTracked.current) {
      demoTracked.current = true;
      trackAnalyticsEvent("demo_entered", { entry_point: "demo" });
    }
  }, [consent, enabled, pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-analytics-event]") : null;
      if (!target) return;
      const name = target.dataset.analyticsEvent as AnalyticsEventName | undefined;
      if (!name) return;
      const location = target.dataset.analyticsLocation;
      const label = target.dataset.analyticsLabel;
      trackAnalyticsEvent(name, {
        ...(location ? { location } : {}),
        ...(label ? { label } : {})
      });
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  function saveConsent(next: AnalyticsConsent) {
    window.localStorage.setItem(analyticsConsentStorageKey, next);
    setConsent(next);
    setPreferencesOpen(false);
  }

  if (!enabled || !preferencesOpen) return null;

  return (
    <section aria-label="Analytics preference" className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl border border-border bg-panel p-5 shadow-lg sm:inset-x-8">
      <h2 className="text-lg font-black">Help us improve Skill Dockyard</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">With your permission, we use Google analytics to understand site visits, campaigns, and feature use. We do not send account details, workspace information, skill content, or links with tokens.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className="inline-flex min-h-10 items-center justify-center bg-primary px-4 text-sm font-semibold text-primary-foreground" onClick={() => saveConsent("granted")}>Allow analytics</button>
        <button type="button" className="inline-flex min-h-10 items-center justify-center border border-border px-4 text-sm font-semibold" onClick={() => saveConsent("denied")}>Decline</button>
      </div>
    </section>
  );
}

export function AnalyticsPreferencesButton() {
  return <button type="button" className="font-bold text-primary underline underline-offset-4" onClick={() => window.dispatchEvent(new Event(openPreferencesEvent))}>Manage analytics preferences</button>;
}
