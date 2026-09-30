import type { TavilyApiResult } from "@/lib/discovery/providers/tavily-map";
import {
  countTokenMatches,
  hostnameContainsStrongToken,
  normalizeBusinessNameTokens,
} from "@/lib/discovery/poc/business-verification/business-name-tokens";
import {
  countDistinctiveTokenMatches,
  filterDistinctiveTokens,
  isGenericBusinessDisplayName,
} from "@/lib/discovery/poc/business-verification/generic-business-name";
import {
  classifyVerificationDomain,
  extractHostname,
  isIndependentOfficialDomainCategory,
} from "@/lib/discovery/poc/business-verification/verification-domain";
import { assessUrlQuality } from "@/lib/discovery/poc/business-verification/url-quality";
import type {
  GooglePlaceRow,
  ShortlistEvaluation,
  TavilyEvidenceRow,
  VerificationOutcome,
} from "@/lib/discovery/poc/business-verification/types";

export const DEFAULT_POC_CONFIG = {
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
} as const;

const LOCATION_TOKENS = ["חיפה", "haifa"];

export function isOperationalBusinessStatus(status: string | undefined): boolean {
  return (status ?? "OPERATIONAL") === "OPERATIONAL";
}

export function providerWebsiteListed(place: GooglePlaceRow): boolean {
  return Boolean(place.websiteUri?.trim());
}

export function dedupePlacesById<T extends { placeId: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    if (seen.has(row.placeId)) {
      continue;
    }
    seen.add(row.placeId);
    out.push(row);
  }
  return out;
}

export function applyGoogleResultsCap<T>(rows: T[], maxResults: number): T[] {
  return rows.slice(0, maxResults);
}

export function assertGoogleRequestBudget(
  requestCount: number,
  maxRequests: number
): void {
  if (requestCount > maxRequests) {
    throw new Error("POC_GOOGLE_REQUEST_CAP_EXCEEDED");
  }
}

export function buildTavilyVerificationQuery(displayName: string, cityHe: string): string {
  return `"${displayName.trim()}" "${cityHe.trim()}"`;
}

function mentionsLocation(text: string): boolean {
  const lower = text.toLowerCase();
  return LOCATION_TOKENS.some((token) => lower.includes(token.toLowerCase()));
}

type OfficialCandidate = {
  url: string;
  domain: string;
  distinctiveMatches: number;
  locationMentioned: boolean;
};

function qualifiesAsIndependentOfficial(
  row: TavilyEvidenceRow,
  tokens: readonly string[],
  businessName: string
): boolean {
  if (!row.url || !row.domain) {
    return false;
  }

  if (!isIndependentOfficialDomainCategory(row.domainCategory)) {
    return false;
  }

  const urlQuality = assessUrlQuality(row.url);
  if (urlQuality === "weak") {
    return false;
  }

  const distinctiveTokens = filterDistinctiveTokens(tokens);
  const distinctiveMatches = countDistinctiveTokenMatches(
    tokens,
    row.title ?? "",
    row.snippet ?? "",
    row.domain
  );

  if (distinctiveTokens.length > 0 && distinctiveMatches === 0) {
    return false;
  }

  const hostnameMatch = hostnameContainsStrongToken(distinctiveTokens, row.domain);
  const genericName = isGenericBusinessDisplayName(businessName);

  if (genericName) {
    if (!row.locationMentioned) {
      return false;
    }
    if (!hostnameMatch) {
      return false;
    }
    return distinctiveMatches >= 1;
  }

  if (hostnameMatch && distinctiveMatches >= 1) {
    return true;
  }

  if (distinctiveMatches >= 2 && row.locationMentioned) {
    return true;
  }

  return false;
}

function collectStrictOfficialCandidates(
  tokens: readonly string[],
  evidence: TavilyEvidenceRow[],
  businessName: string
): OfficialCandidate[] {
  const candidates: OfficialCandidate[] = [];
  for (const row of evidence) {
    if (!qualifiesAsIndependentOfficial(row, tokens, businessName)) {
      continue;
    }
    candidates.push({
      url: row.url!,
      domain: row.domain!,
      distinctiveMatches: countDistinctiveTokenMatches(
        tokens,
        row.title ?? "",
        row.snippet ?? "",
        row.domain ?? ""
      ),
      locationMentioned: row.locationMentioned,
    });
  }
  return candidates;
}

function hasConflictingOfficialNoise(
  evidence: TavilyEvidenceRow[],
  tokens: readonly string[]
): boolean {
  const misleading = evidence.filter((row) => {
    if (row.domainCategory !== "possibleOfficial" || !row.url) {
      return false;
    }
    if (assessUrlQuality(row.url) === "weak") {
      return false;
    }
    const distinctiveMatches = countDistinctiveTokenMatches(
      tokens,
      row.title ?? "",
      row.snippet ?? "",
      row.domain ?? ""
    );
    return row.locationMentioned && distinctiveMatches === 0 && row.nameMatchScore >= 2;
  });

  return misleading.length >= 2;
}

function hasGenericNameSocialAmbiguity(
  businessName: string,
  evidence: TavilyEvidenceRow[]
): boolean {
  if (!isGenericBusinessDisplayName(businessName)) {
    return false;
  }
  const socialHits = evidence.filter(
    (row) => row.domainCategory === "social" && row.nameMatchScore >= 1
  );
  return socialHits.length >= 2;
}

function hasMatchingSocial(evidence: TavilyEvidenceRow[]): boolean {
  return evidence.some(
    (row) => row.domainCategory === "social" && row.nameMatchScore >= 1
  );
}

function hasUsableEvidence(evidence: TavilyEvidenceRow[]): boolean {
  return evidence.some((row) => Boolean(row.url && row.domain));
}

export function mapTavilyResultsToEvidence(
  businessName: string,
  results: TavilyApiResult[]
): TavilyEvidenceRow[] {
  const tokens = normalizeBusinessNameTokens(businessName);
  return results.map((result, index) => {
    const url = result.url?.trim();
    const title = result.title?.trim() ?? "";
    const snippet = result.content?.trim() ?? "";
    const domain = extractHostname(url);
    const domainCategory = classifyVerificationDomain(url ?? domain);
    const nameMatchScore = countTokenMatches(tokens, title, snippet, domain ?? "");
    return {
      rank: index + 1,
      url,
      title: title || undefined,
      domain,
      domainCategory,
      nameMatchScore,
      snippet: snippet || undefined,
      locationMentioned: mentionsLocation(`${title} ${snippet}`),
    };
  });
}

export function decideVerificationOutcome(input: {
  providerWebsiteListed: boolean;
  tavilyError?: string;
  evidence: TavilyEvidenceRow[];
  businessName: string;
}): { outcome: VerificationOutcome; reasonHe: string; matchingExplanation: string[] } {
  const explanation: string[] = [];
  const tokens = normalizeBusinessNameTokens(input.businessName);

  if (input.providerWebsiteListed) {
    explanation.push("Google Places returned websiteUri for this listing.");
    return {
      outcome: "websiteConfirmed",
      reasonHe: "מופיע אתר ברשימת Google Places.",
      matchingExplanation: explanation,
    };
  }

  if (input.tavilyError) {
    explanation.push(`Tavily error: ${input.tavilyError}`);
    return {
      outcome: "insufficientEvidence",
      reasonHe: "בדיקת Web משנית נכשלה; אין מספיק ראיות.",
      matchingExplanation: explanation,
    };
  }

  if (!hasUsableEvidence(input.evidence)) {
    explanation.push("No parseable Tavily result URLs.");
    return {
      outcome: "insufficientEvidence",
      reasonHe: "בדיקת Web משנית לא החזירה תוצאות שימושיות.",
      matchingExplanation: explanation,
    };
  }

  const strictOfficials = collectStrictOfficialCandidates(
    tokens,
    input.evidence,
    input.businessName
  );

  if (strictOfficials.length >= 2) {
    const uniqueDomains = new Set(strictOfficials.map((c) => c.domain));
    if (uniqueDomains.size >= 2) {
      explanation.push(
        `Multiple independent official domains: ${[...uniqueDomains].join(", ")}`
      );
      return {
        outcome: "ambiguous",
        reasonHe: "נמצאו מספר אתרים אפשריים; זהות/אתר רשמי לא ברור.",
        matchingExplanation: explanation,
      };
    }
  }

  if (strictOfficials.length === 1) {
    explanation.push(`Independent official site: ${strictOfficials[0]?.domain}`);
    return {
      outcome: "websiteConfirmed",
      reasonHe: "בבדיקת Web נוספת נמצא אתר עצמאי שתואם לשם העסק.",
      matchingExplanation: explanation,
    };
  }

  if (hasConflictingOfficialNoise(input.evidence, tokens)) {
    explanation.push(
      "Multiple location-matched domains without distinctive business identity (possible wrong business)."
    );
    return {
      outcome: "ambiguous",
      reasonHe: "נמצאו מספר אתרים אפשריים; זהות/אתר רשמי לא ברור.",
      matchingExplanation: explanation,
    };
  }

  if (hasGenericNameSocialAmbiguity(input.businessName, input.evidence)) {
    explanation.push("Generic business name with multiple social profiles.");
    return {
      outcome: "ambiguous",
      reasonHe: "שם עסק גנרי עם מספר נוכחויות; לא ניתן לאשר אתר עצמאי.",
      matchingExplanation: explanation,
    };
  }

  if (hasMatchingSocial(input.evidence)) {
    explanation.push(
      "Social/booking/profile pages found; no credible independent official domain."
    );
    return {
      outcome: "socialOnly",
      reasonHe: "לא מופיע אתר עצמאי; נמצאה נוכחות ברשתות חברתיות או בפרופילים.",
      matchingExplanation: explanation,
    };
  }

  explanation.push(
    "Google did not list websiteUri; secondary search found no credible independent official website."
  );
  return {
    outcome: "noWebsiteListedAndNotFound",
    reasonHe:
      "Google לא הציג אתר לרישום זה, ובבדיקת Web נוספת לא נמצא אתר רשמי עצמאי מהימן.",
    matchingExplanation: explanation,
  };
}

export function isInboxEligibleOutcome(outcome: VerificationOutcome): boolean {
  return outcome === "noWebsiteListedAndNotFound" || outcome === "socialOnly";
}

export function buildProviderWebsiteConfirmedEvaluation(
  place: GooglePlaceRow
): ShortlistEvaluation {
  return {
    placeId: place.placeId,
    displayName: place.displayName,
    formattedAddress: place.formattedAddress,
    primaryType: place.primaryType,
    businessStatus: place.businessStatus,
    googleMapsUri: place.googleMapsUri,
    providerWebsiteListed: true,
    providerWebsiteUri: place.websiteUri,
    operational: isOperationalBusinessStatus(place.businessStatus),
    tavilyEvidence: [],
    verificationOutcome: "websiteConfirmed",
    reasonHe: "מופיע אתר ברשימת Google Places.",
    matchingExplanation: ["Skipped Tavily: provider websiteUri present."],
    inboxEligible: false,
    manualReview: null,
  };
}

export function buildNonOperationalEvaluation(place: GooglePlaceRow): ShortlistEvaluation {
  return {
    placeId: place.placeId,
    displayName: place.displayName,
    formattedAddress: place.formattedAddress,
    primaryType: place.primaryType,
    businessStatus: place.businessStatus,
    googleMapsUri: place.googleMapsUri,
    providerWebsiteListed: providerWebsiteListed(place),
    providerWebsiteUri: place.websiteUri,
    operational: false,
    tavilyEvidence: [],
    verificationOutcome: "insufficientEvidence",
    reasonHe: "עסק לא פעיל (לא OPERATIONAL).",
    matchingExplanation: ["Filtered: businessStatus is not OPERATIONAL."],
    inboxEligible: false,
    manualReview: null,
  };
}
