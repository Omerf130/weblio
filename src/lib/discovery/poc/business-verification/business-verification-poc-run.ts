import {
  BUSINESS_VERIFICATION_GOOGLE_SKU_NOTE,
  BUSINESS_VERIFICATION_PLACES_FIELD_MASK,
  PLACES_TEXT_SEARCH_URL,
  buildPlacesTextSearchBodyFromConfig,
  fetchPlacesTextSearch,
  parsePlacesTextSearchResponse,
  type GooglePlacesTextSearchDeps,
} from "@/lib/discovery/poc/business-verification/google-places-text-search";
import {
  countOutcomes,
} from "@/lib/discovery/poc/business-verification/business-verification-report";
import { runTavilyWebsiteVerification } from "@/lib/discovery/poc/business-verification/tavily-verification";
import { BUSINESS_VERIFICATION_TAVILY_SEARCH_DEPTH } from "@/lib/discovery/poc/business-verification/tavily-verification";
import type {
  BusinessVerificationPocArtifact,
  BusinessVerificationPocConfig,
  CategoryMismatchExcludedRow,
  ShortlistEvaluation,
} from "@/lib/discovery/poc/business-verification/types";
import type { TavilySearchProviderDeps } from "@/lib/discovery/providers/tavily-search-provider";
import { DEFAULT_BUSINESS_VERIFICATION_POC_CONFIG } from "@/lib/discovery/poc/business-verification/business-verification-poc-config";
import { isPrimaryTypeAcceptedForPoc } from "@/lib/discovery/poc/business-verification/category-relevance";
import {
  applyGoogleResultsCap,
  assertGoogleRequestBudget,
  buildNonOperationalEvaluation,
  buildProviderWebsiteConfirmedEvaluation,
  decideVerificationOutcome,
  dedupePlacesById,
  isInboxEligibleOutcome,
  isOperationalBusinessStatus,
  mapTavilyResultsToEvidence,
  providerWebsiteListed,
} from "@/lib/discovery/poc/business-verification/verification-matcher";
import type { GooglePlaceRow } from "@/lib/discovery/poc/business-verification/types";

export type BusinessVerificationPocRunDeps = {
  google: GooglePlacesTextSearchDeps;
  tavily: TavilySearchProviderDeps;
  config?: BusinessVerificationPocConfig;
};

export type BusinessVerificationPocRunResult = {
  artifact: BusinessVerificationPocArtifact;
};

function toConfig(
  overrides?: Partial<BusinessVerificationPocConfig>
): BusinessVerificationPocConfig {
  return {
    ...DEFAULT_BUSINESS_VERIFICATION_POC_CONFIG,
    ...overrides,
  };
}

export async function runBusinessVerificationPoc(
  deps: BusinessVerificationPocRunDeps
): Promise<BusinessVerificationPocRunResult> {
  const config = toConfig(deps.config);
  const runAt = new Date().toISOString();

  let googleRequestCount = 0;
  googleRequestCount += 1;
  assertGoogleRequestBudget(googleRequestCount, config.maxGoogleTextSearchRequests);

  const body = buildPlacesTextSearchBodyFromConfig(config);
  const placesResponse = await fetchPlacesTextSearch(deps.google, body);
  const parsed = applyGoogleResultsCap(
    parsePlacesTextSearchResponse(placesResponse),
    config.maxGoogleResults
  );

  const providerWebsiteConfirmed: ShortlistEvaluation[] = [];
  const nonOperationalRows: ShortlistEvaluation[] = [];
  const categoryMismatchExcluded: CategoryMismatchExcludedRow[] = [];
  const tavilyShortlistRaw: GooglePlaceRow[] = [];

  for (const place of parsed) {
    if (!isOperationalBusinessStatus(place.businessStatus)) {
      nonOperationalRows.push(buildNonOperationalEvaluation(place));
      continue;
    }
    if (!isPrimaryTypeAcceptedForPoc(place.primaryType, config)) {
      categoryMismatchExcluded.push({
        placeId: place.placeId,
        displayName: place.displayName,
        formattedAddress: place.formattedAddress,
        primaryType: place.primaryType,
        businessStatus: place.businessStatus,
        googleMapsUri: place.googleMapsUri,
        providerWebsiteListed: providerWebsiteListed(place),
      });
      continue;
    }
    if (providerWebsiteListed(place)) {
      providerWebsiteConfirmed.push(buildProviderWebsiteConfirmedEvaluation(place));
      continue;
    }
    tavilyShortlistRaw.push(place);
  }

  const tavilyShortlist = dedupePlacesById(tavilyShortlistRaw);

  let tavilyRequestCount = 0;
  const shortlistEvaluations: ShortlistEvaluation[] = [];

  for (const place of tavilyShortlist) {
    tavilyRequestCount += 1;
    const tavily = await runTavilyWebsiteVerification(
      deps.tavily,
      place.displayName,
      config.cityHe,
      config.maxTavilyResults
    );

    const evidence = tavily.ok
      ? mapTavilyResultsToEvidence(place.displayName, tavily.results)
      : [];

    const decision = decideVerificationOutcome({
      providerWebsiteListed: false,
      tavilyError: tavily.ok ? undefined : tavily.error,
      evidence,
      businessName: place.displayName,
    });

    const evaluation: ShortlistEvaluation = {
      placeId: place.placeId,
      displayName: place.displayName,
      formattedAddress: place.formattedAddress,
      primaryType: place.primaryType,
      businessStatus: place.businessStatus,
      googleMapsUri: place.googleMapsUri,
      providerWebsiteListed: false,
      operational: true,
      tavilyQuery: tavily.query,
      tavilyError: tavily.ok ? undefined : tavily.error,
      tavilyEvidence: evidence,
      verificationOutcome: decision.outcome,
      reasonHe: decision.reasonHe,
      matchingExplanation: decision.matchingExplanation,
      inboxEligible: isInboxEligibleOutcome(decision.outcome),
      manualReview: isInboxEligibleOutcome(decision.outcome) ? null : null,
    };

    shortlistEvaluations.push(evaluation);
  }

  const allEvaluated = [
    ...providerWebsiteConfirmed,
    ...nonOperationalRows,
    ...shortlistEvaluations,
  ];

  const finalCandidates = shortlistEvaluations.filter((row) => row.inboxEligible);

  for (const candidate of finalCandidates) {
    candidate.manualReview = null;
  }

  const operationalCount = parsed.filter((p) =>
    isOperationalBusinessStatus(p.businessStatus)
  ).length;

  const artifact: BusinessVerificationPocArtifact = {
    runAt,
    config,
    google: {
      endpoint: PLACES_TEXT_SEARCH_URL,
      fieldMask: BUSINESS_VERIFICATION_PLACES_FIELD_MASK,
      textSearchRequests: googleRequestCount,
      skuNote: BUSINESS_VERIFICATION_GOOGLE_SKU_NOTE,
    },
    tavily: {
      searchDepth: BUSINESS_VERIFICATION_TAVILY_SEARCH_DEPTH,
      verificationRequests: tavilyRequestCount,
    },
    funnel: {
      totalGoogleResults: parsed.length,
      operational: operationalCount,
      nonOperational: parsed.length - operationalCount,
      providerWebsiteListed: providerWebsiteConfirmed.length,
      providerWebsiteNotListed: tavilyShortlist.length,
      uniqueShortlistAfterDedupe: tavilyShortlist.length,
      categoryMismatchExcluded: categoryMismatchExcluded.length,
    },
    categoryMismatchExcluded,
    outcomes: countOutcomes(allEvaluated),
    finalCandidates,
    shortlistEvaluations,
    providerWebsiteConfirmed,
  };

  return { artifact };
}
