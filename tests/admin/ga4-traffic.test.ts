import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  fetchGa4TrafficSummaryWithClient,
  getGa4PropertyId,
  getGa4ServiceAccountCredentials,
  getGa4TrafficSummary,
  hasGa4ReadCredentials,
  mapGa4ActiveUsersMetric,
  mapGa4ReportToTrafficSummary,
  normalizeGa4PrivateKey,
} from "../../src/lib/analytics/ga4-traffic";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("GA4 traffic configuration", () => {
  it("treats missing GA4 configuration as unavailable credentials", () => {
    delete process.env.GA4_PROPERTY_ID;
    delete process.env.GA4_CLIENT_EMAIL;
    delete process.env.GA4_PRIVATE_KEY;

    assert.equal(hasGa4ReadCredentials(), false);
    assert.equal(getGa4PropertyId(), null);
    assert.equal(getGa4ServiceAccountCredentials(), null);
  });

  it("detects valid individual service-account credentials", () => {
    process.env.GA4_PROPERTY_ID = "518362557";
    process.env.GA4_CLIENT_EMAIL = "reader@example.iam.gserviceaccount.com";
    process.env.GA4_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n";

    assert.equal(hasGa4ReadCredentials(), true);
    assert.equal(getGa4PropertyId(), "518362557");
    assert.deepEqual(getGa4ServiceAccountCredentials(), {
      clientEmail: "reader@example.iam.gserviceaccount.com",
      privateKey: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
    });
  });

  it("normalizes escaped private key line breaks", () => {
    assert.equal(
      normalizeGa4PrivateKey("line1\\nline2"),
      "line1\nline2"
    );
  });

  it("treats placeholder sensitive values as missing", () => {
    process.env.GA4_PROPERTY_ID = "518362557";
    process.env.GA4_CLIENT_EMAIL = "[SENSITIVE]";
    process.env.GA4_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n";

    assert.equal(hasGa4ReadCredentials(), false);
  });
});

describe("GA4 traffic mapping", () => {
  it("maps activeUsers metric strings to integers", () => {
    assert.equal(mapGa4ActiveUsersMetric("42"), 42);
    assert.equal(mapGa4ActiveUsersMetric(""), 0);
    assert.equal(mapGa4ActiveUsersMetric(undefined), 0);
  });

  it("maps report values to connected traffic summary", () => {
    assert.deepEqual(mapGa4ReportToTrafficSummary("12", "48"), {
      status: "connected",
      weekVisitors: 12,
      monthVisitors: 48,
      weekComparison: null,
      monthComparison: null,
    });
  });
});

describe("GA4 traffic fetching", () => {
  it("requests activeUsers for 7-day and 30-day ranges", async () => {
    const requests: Array<{
      property: string;
      dateRanges: Array<{ startDate: string; endDate: string }>;
      metrics: Array<{ name: string }>;
    }> = [];

    const summary = await fetchGa4TrafficSummaryWithClient(
      {
        runReport: async (request) => {
          requests.push(request);

          const startDate = request.dateRanges[0]?.startDate;
          const value = startDate === "7daysAgo" ? "15" : "120";

          return [{ rows: [{ metricValues: [{ value }] }] }];
        },
      },
      "518362557"
    );

    assert.equal(requests.length, 2);
    assert.deepEqual(requests[0], {
      property: "properties/518362557",
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      metrics: [{ name: "activeUsers" }],
    });
    assert.deepEqual(requests[1], {
      property: "properties/518362557",
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      metrics: [{ name: "activeUsers" }],
    });
    assert.deepEqual(summary, {
      status: "connected",
      weekVisitors: 15,
      monthVisitors: 120,
      weekComparison: null,
      monthComparison: null,
    });
  });

  it("returns unavailable summary when credentials are missing", async () => {
    delete process.env.GA4_PROPERTY_ID;
    delete process.env.GA4_CLIENT_EMAIL;
    delete process.env.GA4_PRIVATE_KEY;

    const summary = await getGa4TrafficSummary();

    assert.deepEqual(summary, {
      status: "unavailable",
      weekVisitors: null,
      monthVisitors: null,
      weekComparison: null,
      monthComparison: null,
    });
  });

  it("falls back to unavailable summary when the analytics client throws", async () => {
    process.env.GA4_PROPERTY_ID = "518362557";
    process.env.GA4_CLIENT_EMAIL = "reader@example.iam.gserviceaccount.com";
    process.env.GA4_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n";

    const originalClient = (await import("@google-analytics/data")).BetaAnalyticsDataClient;
    const analyticsModule = await import("@google-analytics/data");

    Object.defineProperty(analyticsModule, "BetaAnalyticsDataClient", {
      configurable: true,
      value: class MockFailingClient {
        runReport() {
          throw new Error("API unavailable");
        }
      },
    });

    try {
      const summary = await getGa4TrafficSummary();
      assert.deepEqual(summary, {
        status: "unavailable",
        weekVisitors: null,
        monthVisitors: null,
        weekComparison: null,
        monthComparison: null,
      });
    } finally {
      Object.defineProperty(analyticsModule, "BetaAnalyticsDataClient", {
        configurable: true,
        value: originalClient,
      });
    }
  });
});
