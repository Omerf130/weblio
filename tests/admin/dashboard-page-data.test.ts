import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { GA4_TRAFFIC_REVALIDATE_SECONDS } from "../../src/lib/analytics/ga4-traffic";

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(testDir, "../..");

describe("admin dashboard page data", () => {
  it("loads Mongo dashboard stats without coupling to GA4 in dashboard data layer", () => {
    const dashboardSrc = readFileSync(
      join(repoRoot, "src/lib/data/dashboard.ts"),
      "utf8"
    );

    assert.doesNotMatch(dashboardSrc, /getGa4TrafficSummary/);
    assert.match(dashboardSrc, /getDashboardStats\(\)/);
  });

  it("renders GA4 in a Suspense-bound async server widget on the admin page", () => {
    const pageSrc = readFileSync(
      join(repoRoot, "src/app/admin/(protected)/page.tsx"),
      "utf8"
    );

    assert.match(pageSrc, /Suspense/);
    assert.match(pageSrc, /DashboardTrafficWidgetAsync/);
    assert.match(pageSrc, /DashboardTrafficWidgetLoading/);
    assert.match(pageSrc, /getDashboardPageData/);
    assert.doesNotMatch(pageSrc, /getGa4TrafficSummary/);
  });

  it("fetches GA4 on the server inside the async traffic widget module", () => {
    const widgetSrc = readFileSync(
      join(
        repoRoot,
        "src/components/admin/dashboard/DashboardTrafficWidgetAsync.tsx"
      ),
      "utf8"
    );

    assert.match(widgetSrc, /getCachedGa4TrafficSummary/);
    assert.match(widgetSrc, /DashboardTrafficWidget/);
    assert.doesNotMatch(widgetSrc, /"use client"/);
  });
});

describe("GA4 traffic server cache", () => {
  it("uses a 5–15 minute revalidate window for dashboard traffic", () => {
    assert.ok(GA4_TRAFFIC_REVALIDATE_SECONDS >= 300);
    assert.ok(GA4_TRAFFIC_REVALIDATE_SECONDS <= 900);
  });

  it("wraps GA4 fetch in unstable_cache (Next.js server runtime only)", () => {
    const ga4Src = readFileSync(
      join(repoRoot, "src/lib/analytics/ga4-traffic.ts"),
      "utf8"
    );

    assert.match(ga4Src, /unstable_cache/);
    assert.match(ga4Src, /getCachedGa4TrafficSummary/);
    assert.match(ga4Src, /getGa4TrafficSummary\(\)/);
    assert.match(ga4Src, /tags:\s*\[GA4_TRAFFIC_CACHE_TAG\]/);
  });
});
