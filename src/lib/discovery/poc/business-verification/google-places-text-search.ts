import type { BusinessVerificationPocConfig } from "@/lib/discovery/poc/business-verification/types";
import type { GooglePlaceRow } from "@/lib/discovery/poc/business-verification/types";

export const PLACES_TEXT_SEARCH_URL =
  "https://places.googleapis.com/v1/places:searchText";

export const BUSINESS_VERIFICATION_PLACES_FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.primaryType,places.businessStatus,places.websiteUri,places.googleMapsUri";

export const BUSINESS_VERIFICATION_GOOGLE_SKU_NOTE =
  "Text Search (New) billed at highest requested field tier: Enterprise (websiteUri); other listed fields are Pro/Essentials per Place Data Fields table.";

export type PlacesTextSearchRequestBody = {
  textQuery: string;
  languageCode: string;
  regionCode: string;
  pageSize: number;
  includedType: string;
  strictTypeFiltering: boolean;
};

export type PlacesApiPlace = {
  id?: string;
  displayName?: { text?: string; languageCode?: string };
  formattedAddress?: string;
  primaryType?: string;
  businessStatus?: string;
  websiteUri?: string;
  googleMapsUri?: string;
};

export type PlacesTextSearchResponse = {
  places?: PlacesApiPlace[];
};

export function buildPlacesTextSearchBodyFromConfig(
  config: Pick<
    BusinessVerificationPocConfig,
    "textQuery" | "languageCode" | "regionCode" | "maxGoogleResults" | "includedType"
  >
): PlacesTextSearchRequestBody {
  return {
    textQuery: config.textQuery,
    languageCode: config.languageCode,
    regionCode: config.regionCode,
    pageSize: config.maxGoogleResults,
    includedType: config.includedType,
    strictTypeFiltering: true,
  };
}

/** @deprecated PoC #1 — prefer buildPlacesTextSearchBodyFromConfig + HAIFA_BEAUTY_SALONS_POC_CONFIG */
export function buildHaifaBeautySalonsTextSearchBody(
  pageSize: number
): PlacesTextSearchRequestBody {
  return buildPlacesTextSearchBodyFromConfig({
    textQuery: "מספרות ומכוני יופי בחיפה",
    languageCode: "he",
    regionCode: "IL",
    maxGoogleResults: pageSize,
    includedType: "beauty_salon",
  });
}

export function mapPlacesApiPlace(row: PlacesApiPlace): GooglePlaceRow | null {
  const placeId = row.id?.trim();
  const displayName = row.displayName?.text?.trim();
  if (!placeId || !displayName) {
    return null;
  }

  return {
    placeId,
    displayName,
    formattedAddress: row.formattedAddress?.trim() ?? "",
    primaryType: row.primaryType?.trim() || undefined,
    businessStatus: row.businessStatus?.trim() || undefined,
    websiteUri: row.websiteUri?.trim() || undefined,
    googleMapsUri: row.googleMapsUri?.trim() || undefined,
  };
}

export function parsePlacesTextSearchResponse(
  payload: PlacesTextSearchResponse
): GooglePlaceRow[] {
  const places = payload.places ?? [];
  const mapped: GooglePlaceRow[] = [];
  for (const place of places) {
    const row = mapPlacesApiPlace(place);
    if (row) {
      mapped.push(row);
    }
  }
  return mapped;
}

export type GooglePlacesTextSearchDeps = {
  apiKey: string;
  fetchImpl?: typeof fetch;
};

export async function fetchPlacesTextSearch(
  deps: GooglePlacesTextSearchDeps,
  body: PlacesTextSearchRequestBody,
  fieldMask: string = BUSINESS_VERIFICATION_PLACES_FIELD_MASK
): Promise<PlacesTextSearchResponse> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const response = await fetchImpl(PLACES_TEXT_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": deps.apiKey,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `GOOGLE_PLACES_HTTP_${response.status}${errorText ? `: ${errorText.slice(0, 300)}` : ""}`
    );
  }

  return (await response.json()) as PlacesTextSearchResponse;
}
