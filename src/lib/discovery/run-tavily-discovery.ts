import { noopIntentClassifier } from "@/lib/discovery/classifier/noop-classifier";
import type { IntentClassifier } from "@/lib/discovery/classifier/types";
import {
  getProductionDiscoveryPolicy,
  tavilyRequestPolicyFromDiscoveryPolicy,
  type DiscoveryPolicy,
} from "@/lib/discovery/discovery-policy";
import { dedupeRunCandidates } from "@/lib/discovery/dedupe-run-candidates";
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
import {
  createEmptyTavilyDiscoveryRunSummary,
  type TavilyDiscoveryRunSummary,
} from "@/lib/discovery/tavily-discovery-run-summary";
import { loadSearchProfileCatalogProduction } from "@/lib/discovery/providers/load-search-profiles";
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
};

function resolveProfilesForRun(
  catalog: DiscoverySearchProfileCatalog,
  policy: DiscoveryPolicy
): DiscoverySearchProfile[] {
  const maxProfiles = policy.limits.maxProfilesPerRun;
  const maxRequests = policy.limits.maxTavilyRequestsPerRun;
  const cap = Math.min(maxProfiles, maxRequests, catalog.profiles.length);
  return catalog.profiles.slice(0, cap);
}

function toTavilySearchRequestPolicy(
  policy: DiscoveryPolicy
): TavilySearchRequestPolicy {
  const mapped = tavilyRequestPolicyFromDiscoveryPolicy(policy);
  return {
    timeRange: mapped.timeRange,
    excludeDomains: mapped.excludeDomains,
  };
}

async function ingestCandidatesWithClassificationCap(
  candidates: PreIngestCandidate[],
  policy: DiscoveryPolicy,
  deps: RunTavilyProductionDiscoveryDeps,
  summary: TavilyDiscoveryRunSummary
): Promise<void> {
  const ingestFn = deps.ingestDiscoveredResult ?? ingestDiscoveredResult;
  const baseClassifier = deps.getClassifier?.() ?? noopIntentClassifier;
  let classificationsRemaining = policy.limits.maxClassificationsPerRun;

  summary.ingestReceived = candidates.length;
  summary.classificationLimit = policy.limits.maxClassificationsPerRun;

  let skippedDueToClassificationCap = 0;

  for (const candidate of candidates) {
    const blockedByClassificationCap = classificationsRemaining <= 0;
    const classifier = blockedByClassificationCap
      ? noopIntentClassifier
      : baseClassifier;

    let outcome: IngestDiscoveredOutcome;
    try {
      outcome = await ingestFn(candidate.normalized, {
        classifier,
        deps: deps.ingestDeps,
      });
    } catch {
      summary.failed += 1;
      continue;
    }

    if (!outcome.ok) {
      summary.failed += 1;
      continue;
    }

    if (outcome.created) {
      summary.created += 1;
    } else {
      summary.rediscovered += 1;
    }

    if (outcome.classified) {
      summary.classified += 1;
      classificationsRemaining -= 1;
    } else if (outcome.classification === "unclassified") {
      summary.unclassified += 1;
      if (blockedByClassificationCap) {
        skippedDueToClassificationCap += 1;
      }
    }
  }

  summary.classificationLimitReached = skippedDueToClassificationCap > 0;
}

export async function runTavilyProductionDiscovery(
  deps: RunTavilyProductionDiscoveryDeps
): Promise<TavilyDiscoveryRunSummary> {
  const policy = deps.getPolicy?.() ?? getProductionDiscoveryPolicy();
  const catalog = deps.loadCatalog?.() ?? loadSearchProfileCatalogProduction();
  const profiles = resolveProfilesForRun(catalog, policy);

  const summary = createEmptyTavilyDiscoveryRunSummary(
    policy.limits.maxClassificationsPerRun,
    catalog.profiles.length
  );

  const tavilyRequest = toTavilySearchRequestPolicy(policy);
  const excludedDomains = policy.tavily.excludeDomains;
  const allCandidates: PreIngestCandidate[] = [];

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
    }

    const { candidates, counts } = filterMappedRowsForIngest(
      result.rows,
      profile.id,
      excludedDomains
    );
    mergePreIngestFilterCounts(summary, counts);
    allCandidates.push(...candidates);
  }

  const { unique, filteredDuplicateInRun } = dedupeRunCandidates(allCandidates);
  summary.filteredDuplicateInRun = filteredDuplicateInRun;

  const maxCandidates = policy.limits.maxCandidatesPerRun;
  const limited =
    unique.length > maxCandidates ? unique.slice(0, maxCandidates) : unique;
  summary.uniqueCandidates = limited.length;
  summary.candidatesLimited = Math.max(0, unique.length - limited.length);

  await ingestCandidatesWithClassificationCap(limited, policy, deps, summary);

  return summary;
}
