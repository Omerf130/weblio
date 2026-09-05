"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import ReactGA from "react-ga4";
import { initMetaPixel, trackMetaPageView } from "@/utils/metaPixel";

const GA_MEASUREMENT_ID = "G-9G2M3T5KEG";

function isAdminRoute(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function buildPagePath(pathname: string, queryString: string): string {
  return pathname + (queryString ? `?${queryString}` : "");
}

function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    ReactGA.initialize(GA_MEASUREMENT_ID, {
      gtagOptions: { send_page_view: false },
    });
    initMetaPixel();
  }, []);

  useEffect(() => {
    const page = buildPagePath(pathname, queryString);

    if (isAdminRoute(pathname)) {
      lastTrackedPath.current = page;
      return;
    }

    if (page === lastTrackedPath.current) return;

    lastTrackedPath.current = page;
    ReactGA.send({ hitType: "pageview", page });
    trackMetaPageView();
  }, [pathname, queryString]);

  return null;
}

export default function AnalyticsProviders() {
  return (
    <Suspense fallback={null}>
      <AnalyticsTracker />
    </Suspense>
  );
}
