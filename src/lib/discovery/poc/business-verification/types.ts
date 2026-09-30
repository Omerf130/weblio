export type VerificationOutcome =
  | "websiteConfirmed"
  | "noWebsiteListedAndNotFound"
  | "socialOnly"
  | "ambiguous"
  | "insufficientEvidence";

export type VerificationDomainCategory =
  | "possibleOfficial"
  | "social"
  | "directory"
  | "marketplace"
  | "news"
  | "bookingPlatform"
  | "businessProfilePlatform"
  | "appStore"
  | "unknown";

export type ManualReviewLabel =
  | "trueProspect"
  | "hasOfficialSite"
  | "wrongBusiness"
  | "unclear";

export type CategoryMismatchExcludedRow = {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  primaryType?: string;
  businessStatus?: string;
  googleMapsUri?: string;
  providerWebsiteListed: boolean;
};

export type GooglePlaceRow = {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  primaryType?: string;
  businessStatus?: string;
  websiteUri?: string;
  googleMapsUri?: string;
};

export type TavilyEvidenceRow = {
  rank: number;
  url?: string;
  title?: string;
  domain?: string;
  domainCategory: VerificationDomainCategory;
  nameMatchScore: number;
  snippet?: string;
  locationMentioned: boolean;
};

export type ShortlistEvaluation = {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  primaryType?: string;
  businessStatus?: string;
  googleMapsUri?: string;
  providerWebsiteListed: boolean;
  providerWebsiteUri?: string;
  operational: boolean;
  tavilyQuery?: string;
  tavilyError?: string;
  tavilyEvidence: TavilyEvidenceRow[];
  verificationOutcome: VerificationOutcome;
  reasonHe: string;
  matchingExplanation: string[];
  inboxEligible: boolean;
  manualReview: ManualReviewLabel | null;
};

export type BusinessVerificationPocConfig = {
  city: string;
  cityHe: string;
  categoryLabel: string;
  textQuery: string;
  includedType: string;
  languageCode: string;
  regionCode: string;
  maxGoogleResults: number;
  maxTavilyResults: number;
  maxGoogleTextSearchRequests: number;
  /** Google `primaryType` values allowed into verification; empty = no gate. */
  acceptedPrimaryTypes: readonly string[];
};

export type BusinessVerificationPocArtifact = {
  runAt: string;
  config: BusinessVerificationPocConfig;
  google: {
    endpoint: string;
    fieldMask: string;
    textSearchRequests: number;
    skuNote: string;
  };
  tavily: {
    searchDepth: string;
    verificationRequests: number;
  };
  funnel: {
    totalGoogleResults: number;
    operational: number;
    nonOperational: number;
    providerWebsiteListed: number;
    providerWebsiteNotListed: number;
    uniqueShortlistAfterDedupe: number;
    categoryMismatchExcluded: number;
  };
  categoryMismatchExcluded: CategoryMismatchExcludedRow[];
  outcomes: Record<VerificationOutcome, number>;
  finalCandidates: ShortlistEvaluation[];
  shortlistEvaluations: ShortlistEvaluation[];
  providerWebsiteConfirmed: ShortlistEvaluation[];
};
