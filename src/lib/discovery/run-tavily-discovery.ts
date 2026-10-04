import { noopIntentClassifier } from "@/lib/discovery/classifier/noop-classifier";
import type { IntentClassifier } from "@/lib/discovery/classifier/types";
import {
  selectDailyDiscoveryProfiles,
  type DailyProfileSelectionResult,
} from "@/lib/discovery/discovery-daily-profile-selector";
import {
  getV2ProductionDiscoveryPolicy,
  tavilyRequestPolicyFromDiscoveryPolicy,
  type DiscoveryPolicy,
} from "@/lib/discovery/discovery-policy";
import { createDiscoveryProfileMetricsTracker } from "@/lib/discovery/discovery-profile-metrics";
import {
  isDiscoveryCatalogV2,
  type DiscoverySearchProfileV2,
} from "@/lib/discovery/discovery-v2-types";
import { evaluateDiscoveryCandidateQuality } from "@/lib/discovery/discovery-candidate-quality";
import { dedupeRunCandidates } from "@/lib/discovery/dedupe-run-candidates";
import {
  orderCandidatesForClassificationPass,
  selectCandidatesWithFairCap,
  type ProfileIntentMeta,
} from "@/lib/discovery/fair-candidate-selection";
import {
  ingestDiscoveredResult,
  type IngestDiscoveredOutcome,
  type IngestPipelineDeps,
} from "@/lib/discovery/ingest";
import {
  filterMappedRowsForIngest,
  mergePreIngestFilterCounts,
  type PreIngestCandidate,
} from "@/lib/discovery/pre-ingest-filter";
import { applySummaryCreditFields } from "@/lib/discovery/discovery-run-credits";
import type { TavilyHttpAttemptCounter } from "@/lib/discovery/providers/tavily-search-provider";
import {
  createEmptyTavilyDiscoveryRunSummary,
  type TavilyDiscoveryRunSummary,
} from "@/lib/discovery/tavily-discovery-run-summary";
import { loadSearchProfileCatalogV2Production } from "@/lib/discovery/providers/load-search-profiles";
import type {
  DiscoverySearchProfile,
  DiscoverySearchProfileCatalog,
  DiscoverySearchProvider,
  TavilySearchRequestPolicy,
} from "@/lib/discovery/providers/types";

export type RunTavilyProductionDiscoveryDeps = {
  provider: DiscoverySearchProvider;
  loadCatalog?: () => DiscoverySearchProfileCatalog;
  getPolicy?: () => DiscoveryPolicy;
  getClassifier?: () => IntentClassifier;
  ingestDiscoveredResult?: typeof ingestDiscoveredResult;
  ingestDeps?: Partial<IngestPipelineDeps>;
  /** Israel-local daily selection anchor (V2 only). */
  referenceDate?: Date;
  /** Shared counter wired into Tavily provider (optional). */
  tavilyHttpAttemptCounter?: TavilyHttpAttemptCounter;
};

type ResolvedProfiles = {
  profiles: DiscoverySearchProfile[];
  selection: DailyProfileSelectionResult | null;
  profileMeta: Map<string, ProfileIntentMeta>;
};

function buildProfileMetaFromV2(
  profiles: DiscoverySearchProfileV2[]
): Map<string, ProfileIntentMeta> {
  const map = new Map<string, ProfileIntentMeta>();
  for (const profile of profiles) {
    map.set(profile.id, { intentStrength: profile.intentStrength });
  }
  return map;
}

function resolveProfilesForRun(
  catalog: DiscoverySearchProfileCatalog,
  policy: DiscoveryPolicy,
  referenceDate: Date
): ResolvedProfiles {
  if (isDiscoveryCatalogV2(catalog)) {
    const selection = selectDailyDiscoveryProfiles(catalog, referenceDate);
    const maxSearch = Math.min(
      policy.limits.maxProfilesPerRun,
      policy.limits.maxTavilyRequestsPerRun,
      selection.selected.length
    );
    const profiles = selection.selected.slice(0, maxSearch);
    return {
      profiles,
      selection,
      profileMeta: buildProfileMetaFromV2(selection.selected),
    };
  }

  const maxProfiles = policy.limits.maxProfilesPerRun;
  const maxRequests = policy.limits.maxTavilyRequestsPerRun;
  const cap = Math.min(maxProfiles, maxRequests, catalog.profiles.length);
  return {
    profiles: catalog.profiles.slice(0, cap),
    selection: null,
    profileMeta: new Map(),
  };
}

function toTavilySearchRequestPolicy(
  policy: DiscoveryPolicy
): TavilySearchRequestPolicy {
  const mapped = tavilyRequestPolicyFromDiscoveryPolicy(policy);
  return {
    timeRange: mapped.timeRange,
    excludeDomains: mapped.excludeDomains,
    topic: mapped.topic,
    country: mapped.country,
  };
}

function applyCandidateCap(
  unique: PreIngestCandidate[],
  policy: DiscoveryPolicy,
  profileMeta: Map<string, ProfileIntentMeta>,
  useFairSelection: boolean
): PreIngestCandidate[] {
  const maxCandidates = policy.limits.maxCandidatesPerRun;
  if (unique.length <= maxCandidates) {
    return unique;
  }
  if (useFairSelection && profileMeta.size > 0) {
    return selectCandidatesWithFairCap(unique, {
      globalCap: maxCandidates,
      profileMeta,
    });
  }
  return unique.slice(0, maxCandidates);
}

async function ingestCandidatesWithClassificationCap(
  candidates: PreIngestCandidate[],
  policy: DiscoveryPolicy,
  deps: RunTavilyProductionDiscoveryDeps,
  summary: TavilyDiscoveryRunSummary,
  profileMetrics: ReturnType<typeof createDiscoveryProfileMetricsTracker>,
  profileMeta: Map<string, ProfileIntentMeta>,
  useClassificationOrdering: boolean
): Promise<void> {
  const ingestFn = deps.ingestDiscoveredResult ?? ingestDiscoveredResult;
  const baseClassifier = deps.getClassifier?.() ?? noopIntentClassifier;
  let classificationsRemaining = policy.limits.maxClassificationsPerRun;

  const ordered = useClassificationOrdering
    ? orderCandidatesForClassificationPass(candidates, {
        maxClassifications: policy.limits.maxClassificationsPerRun,
        profileMeta,
      })
    : candidates;

  summary.ingestReceived = ordered.length;
  summary.classificationLimit = policy.limits.maxClassificationsPerRun;

  let skippedDueToClassificationCap = 0;

  for (const candidate of ordered) {
    const blockedByClassificationCap = classificationsRemaining <= 0;
    const classifier = blockedByClassificationCap
      ? noopIntentClassifier
      : baseClassifier;

    let outcome: IngestDiscoveredOutcome;
    try {
      outcome = await ingestFn(candidate.normalized, {
        classifier,
        deps: deps.ingestDeps,
        attemptClassification: !blockedByClassificationCap,
      });
    } catch {
      summary.failed += 1;
      profileMetrics.recordIngestOutcome(candidate.profileId, {
        ok: false,
        code: "INGEST_EXCEPTION",
        message: "Ingest failed",
      });
      continue;
    }

    if (!outcome.ok) {
      summary.failed += 1;
      profileMetrics.recordIngestOutcome(candidate.profileId, outcome);
      continue;
    }

    profileMetrics.recordIngestOutcome(candidate.profileId, outcome);

    if (outcome.persisted) {
      if (outcome.created) {
        summary.created += 1;
      } else if (outcome.rediscovered) {
        summary.rediscovered += 1;
      }
    } else if (outcome.skipReason === "not_actionable") {
      summary.skippedNotActionable += 1;
    } else if (
      outcome.skipReason === "classification_deferred" ||
      outcome.skipReason === "classification_failed" ||
      outcome.skipReason === "auto_classification_skipped"
    ) {
      summary.skippedClassificationDeferred += 1;
    }

    if (outcome.classified) {
      summary.classified += 1;
      classificationsRemaining -= 1;
    } else if (
      outcome.persisted &&
      outcome.classification === "unclassified"
    ) {
      summary.unclassified += 1;
    } else if (
      outcome.skipReason === "classification_deferred" &&
      blockedByClassificationCap
    ) {
      skippedDueToClassificationCap += 1;
    }
  }

  summary.classificationLimitReached = skippedDueToClassificationCap > 0;
}

export async function runTavilyProductionDiscovery(
  deps: RunTavilyProductionDiscoveryDeps
): Promise<TavilyDiscoveryRunSummary> {
  const policy = deps.getPolicy?.() ?? getV2ProductionDiscoveryPolicy();
  const catalog = deps.loadCatalog?.() ?? loadSearchProfileCatalogV2Production();
  const referenceDate = deps.referenceDate ?? new Date();
  const useV2Pipeline = isDiscoveryCatalogV2(catalog);

  const { profiles, selection, profileMeta } = resolveProfilesForRun(
    catalog,
    policy,
    referenceDate
  );

  const summary = createEmptyTavilyDiscoveryRunSummary(
    policy.limits.maxClassificationsPerRun,
    catalog.profiles.length
  );
  summary.profilesSelected = profiles.length;
  summary.selectedProfileIds = profiles.map((p) => p.id);
  summary.selectionShortfallTotal = selection?.shortfall.total ?? 0;

  const tavilyRequest = toTavilySearchRequestPolicy(policy);
  const excludedDomains = policy.tavily.excludeDomains;
  const allCandidates: PreIngestCandidate[] = [];
  const profileMetrics = createDiscoveryProfileMetricsTracker(profiles);

  for (const profile of profiles) {
    summary.profilesSearched += 1;

    const result = await deps.provider.search(profile, {
      maxResults: policy.tavily.maxResultsPerQuery,
      tavilyRequest,
    });

    summary.tavilyRequests += 1;
    summary.rawResults += result.rawResultCount;

    if (result.error) {
      summary.profileErrors.push({
        profileId: profile.id,
        query: profile.queryHe,
        message: result.error,
      });
      profileMetrics.recordProfileRequestError(profile.id, profile.queryHe);
    }

    const { candidates, counts } = filterMappedRowsForIngest(
      result.rows,
      profile.id,
      excludedDomains
    );
    profileMetrics.recordProfileSearch(profile.id, profile.queryHe, {
      raw: result.rawResultCount,
      afterFilter: candidates.length,
    });
    mergePreIngestFilterCounts(summary, counts);

    for (const candidate of candidates) {
      const decision = evaluateDiscoveryCandidateQuality(candidate);
      if (!decision.accepted) {
        profileMetrics.recordQualityRejection(profile.id, decision.reason);
        if (decision.reason === "unsafe_adult") {
          summary.filteredQualitySafety += 1;
        } else if (decision.reason === "jobs_careers") {
          summary.filteredQualityCareers += 1;
        } else {
          summary.filteredQualityLocale += 1;
        }
        continue;
      }
      allCandidates.push(candidate);
    }
  }

  const { unique, filteredDuplicateInRun } = dedupeRunCandidates(allCandidates);
  summary.filteredDuplicateInRun = filteredDuplicateInRun;

  const limited = applyCandidateCap(
    unique,
    policy,
    profileMeta,
    useV2Pipeline
  );
  summary.uniqueCandidates = limited.length;
  summary.candidatesLimited = Math.max(0, unique.length - limited.length);

  profileMetrics.recordUniqueAttributedCandidates(limited);
  summary.profileSummaries = profileMetrics.toSummaries();

  await ingestCandidatesWithClassificationCap(
    limited,
    policy,
    deps,
    summary,
    profileMetrics,
    profileMeta,
    useV2Pipeline
  );

  summary.profileSummaries = profileMetrics.toSummaries();

  if (deps.tavilyHttpAttemptCounter) {
    applySummaryCreditFields(summary, deps.tavilyHttpAttemptCounter.count);
  }

  return summary;
}
