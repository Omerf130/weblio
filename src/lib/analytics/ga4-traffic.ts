import type { Ga4TrafficSummary } from "@/types/dashboard";

const UNAVAILABLE_SUMMARY: Ga4TrafficSummary = {
  status: "unavailable",
  weekVisitors: null,
  monthVisitors: null,
  weekComparison: null,
  monthComparison: null,
};

function hasGa4ReadCredentials(): boolean {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim();
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

  return Boolean(propertyId && (credentialsJson || credentialsPath));
}

export async function getGa4TrafficSummary(): Promise<Ga4TrafficSummary> {
  if (!hasGa4ReadCredentials()) {
    return UNAVAILABLE_SUMMARY;
  }

  // Structured for a future server-side Google Analytics Data API integration.
  return UNAVAILABLE_SUMMARY;
}

export function getGa4SetupInstructions(): string[] {
  return [
    "Create or use a Google Cloud project with the Google Analytics Data API enabled.",
    "Create a service account and download its JSON key.",
    "In Google Analytics, grant the service account Viewer access on the GA4 property linked to G-9G2M3T5KEG.",
    "Add GA4_PROPERTY_ID (numeric property ID, not the measurement ID) to the server environment.",
    "Add GOOGLE_APPLICATION_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS for the service account.",
    "Keep credentials server-side only. Do not expose them to the browser.",
  ];
}
