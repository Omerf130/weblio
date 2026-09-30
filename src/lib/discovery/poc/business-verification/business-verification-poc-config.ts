import type { BusinessVerificationPocConfig } from "@/lib/discovery/poc/business-verification/types";

/**
 * Places API (New) Text Search `includedType` — Table A, Services row.
 * @see https://developers.google.com/maps/documentation/places/web-service/place-types
 */
export const PLACES_INCLUDED_TYPE_ELECTRICIAN = "electrician";

/** Business Verification PoC #2 — Haifa electricians (same pipeline as PoC #1). */
export const HAIFA_ELECTRICIANS_POC_CONFIG: BusinessVerificationPocConfig = {
  city: "Haifa, Israel",
  cityHe: "חיפה",
  categoryLabel: "electricians",
  textQuery: "חשמלאים בחיפה",
  includedType: PLACES_INCLUDED_TYPE_ELECTRICIAN,
  languageCode: "he",
  regionCode: "IL",
  maxGoogleResults: 20,
  maxTavilyResults: 6,
  maxGoogleTextSearchRequests: 1,
  acceptedPrimaryTypes: [PLACES_INCLUDED_TYPE_ELECTRICIAN],
};

/** Active profile used by the live PoC script unless overridden. */
export const DEFAULT_BUSINESS_VERIFICATION_POC_CONFIG = HAIFA_ELECTRICIANS_POC_CONFIG;

/** PoC #1 profile (beauty salons) — retained for reference/tests only. */
export const HAIFA_BEAUTY_SALONS_POC_CONFIG: BusinessVerificationPocConfig = {
  city: "Haifa, Israel",
  cityHe: "חיפה",
  categoryLabel: "beauty salons / hair salons",
  textQuery: "מספרות ומכוני יופי בחיפה",
  includedType: "beauty_salon",
  languageCode: "he",
  regionCode: "IL",
  maxGoogleResults: 20,
  maxTavilyResults: 6,
  maxGoogleTextSearchRequests: 1,
  acceptedPrimaryTypes: ["beauty_salon", "hair_salon", "barber_shop"],
};
