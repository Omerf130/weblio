import { BetaAnalyticsDataClient } from "@google-analytics/data";
import type { Ga4TrafficSummary } from "@/types/dashboard";

const UNAVAILABLE_SUMMARY: Ga4TrafficSummary = {
  status: "unavailable",
  weekVisitors: null,
  monthVisitors: null,
  weekComparison: null,
  monthComparison: null,
};

export type Ga4ServiceAccountCredentials = {
  clientEmail: string;
  privateKey: string;
};

function isMissingEnvValue(value: string | undefined): boolean {
  const trimmed = value?.trim();
  return !trimmed || trimmed === "[SENSITIVE]";
}

export function normalizeGa4PrivateKey(privateKey: string): string {
  const trimmed = privateKey.trim();

  if (trimmed.includes("\\n")) {
    return trimmed.replace(/\\n/g, "\n");
  }

  return trimmed;
}

export function getGa4PropertyId(): string | null {
  const propertyId = process.env.GA4_PROPERTY_ID;

  if (isMissingEnvValue(propertyId)) {
    return null;
  }

  return propertyId!.trim();
}

export function getGa4ServiceAccountCredentials(): Ga4ServiceAccountCredentials | null {
  const clientEmail = process.env.GA4_CLIENT_EMAIL;
  const privateKey = process.env.GA4_PRIVATE_KEY;

  if (isMissingEnvValue(clientEmail) || isMissingEnvValue(privateKey)) {
    return null;
  }

  return {
    clientEmail: clientEmail!.trim(),
    privateKey: normalizeGa4PrivateKey(privateKey!),
  };
}

export function hasGa4ReadCredentials(): boolean {
  return Boolean(getGa4PropertyId() && getGa4ServiceAccountCredentials());
}

export function mapGa4ActiveUsersMetric(value: string | null | undefined): number {
  if (value == null || value.trim() === "") {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function mapGa4ReportToTrafficSummary(
  weekValue: string | null | undefined,
  monthValue: string | null | undefined
): Ga4TrafficSummary {
  return {
    status: "connected",
    weekVisitors: mapGa4ActiveUsersMetric(weekValue),
    monthVisitors: mapGa4ActiveUsersMetric(monthValue),
    weekComparison: null,
    monthComparison: null,
  };
}

type AnalyticsDataClientLike = {
  runReport: (request: {
    property: string;
    dateRanges: Array<{ startDate: string; endDate: string }>;
    metrics: Array<{ name: string }>;
  }) => Promise<
    readonly [
      {
        rows?:
          | Array<{ metricValues?: Array<{ value?: string | null }> | null }>
          | null;
      },
      ...unknown[],
    ]
  >;
};

async function fetchActiveUsersForRange(
  client: AnalyticsDataClientLike,
  property: string,
  startDate: string,
  endDate: string
): Promise<number> {
  const [response] = await client.runReport({
    property,
    dateRanges: [{ startDate, endDate }],
    metrics: [{ name: "activeUsers" }],
  });

  const value = response.rows?.[0]?.metricValues?.[0]?.value;
  return mapGa4ActiveUsersMetric(value);
}

export async function fetchGa4TrafficSummaryWithClient(
  client: AnalyticsDataClientLike,
  propertyId: string
): Promise<Ga4TrafficSummary> {
  const property = `properties/${propertyId}`;

  const [weekVisitors, monthVisitors] = await Promise.all([
    fetchActiveUsersForRange(client, property, "7daysAgo", "today"),
    fetchActiveUsersForRange(client, property, "30daysAgo", "today"),
  ]);

  return mapGa4ReportToTrafficSummary(String(weekVisitors), String(monthVisitors));
}

function createGa4AnalyticsClient(
  credentials: Ga4ServiceAccountCredentials
): BetaAnalyticsDataClient {
  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: credentials.clientEmail,
      private_key: credentials.privateKey,
    },
  });
}

export async function getGa4TrafficSummary(): Promise<Ga4TrafficSummary> {
  const propertyId = getGa4PropertyId();
  const credentials = getGa4ServiceAccountCredentials();

  if (!propertyId || !credentials) {
    return UNAVAILABLE_SUMMARY;
  }

  try {
    const client = createGa4AnalyticsClient(credentials);
    return await fetchGa4TrafficSummaryWithClient(client, propertyId);
  } catch (error) {
    console.error("GA4 traffic summary unavailable due to a server-side analytics error.");
    if (process.env.NODE_ENV !== "production" && error instanceof Error && error.name) {
      console.error(`GA4 error type: ${error.name}`);
    }
    return UNAVAILABLE_SUMMARY;
  }
}

export function getGa4SetupInstructions(): string[] {
  return [
    "Enable the Google Analytics Data API in Google Cloud.",
    "Create a service account and grant it Viewer access on the GA4 property linked to G-9G2M3T5KEG.",
    "Add GA4_PROPERTY_ID (numeric property ID, not the measurement ID) to the server environment.",
    "Add GA4_CLIENT_EMAIL and GA4_PRIVATE_KEY for the service account.",
    "Keep credentials server-side only. Do not expose them to the browser.",
  ];
}
