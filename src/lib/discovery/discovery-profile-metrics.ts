import type { PreIngestCandidate } from "@/lib/discovery/pre-ingest-filter";
import type { IngestDiscoveredOutcome } from "@/lib/discovery/ingest";
import type { DiscoverySearchProfile } from "@/lib/discovery/providers/types";
import type { IntentClassification } from "@/types/intent";

/**
 * Max profiles stored on DiscoveryRun (production cap + small buffer).
 *
 * Metric semantics (first-wins in-run URL dedupe):
 * - raw / afterFilter: per Tavily profile search before dedupe.
 * - uniqueAttributed: candidates ingested after dedupe+cap, credited to winning profileId only.
 * - created / rediscovered / classified / explicitNeed / possibleNeed / irrelevant / unclassified:
 *   ingest outcomes for rows attributed to that profile.
 * - errors: Tavily request failure and ingest failures for that profile.
 */
export const MAX_DISCOVERY_RUN_PROFILE_SUMMARIES = 12;

export type DiscoveryProfileMetricsRow = {
  profileId: string;
  query: string;
  raw: number;
  afterFilter: number;
  uniqueAttributed: number;
  created: number;
  rediscovered: number;
  classified: number;
  explicitNeed: number;
  possibleNeed: number;
  irrelevant: number;
  unclassified: number;
  errors: number;
};

type MutableRow = DiscoveryProfileMetricsRow;

export type DiscoveryProfileMetricsTracker = {
  recordProfileSearch: (
    profileId: string,
    query: string,
    input: { raw: number; afterFilter: number }
  ) => void;
  recordProfileRequestError: (profileId: string, query: string) => void;
  recordUniqueAttributedCandidates: (candidates: PreIngestCandidate[]) => void;
  recordIngestOutcome: (
    profileId: string,
    outcome: IngestDiscoveredOutcome
  ) => void;
  toSummaries: () => DiscoveryProfileMetricsRow[];
};

function createEmptyRow(profileId: string, query: string): MutableRow {
  return {
    profileId,
    query,
    raw: 0,
    afterFilter: 0,
    uniqueAttributed: 0,
    created: 0,
    rediscovered: 0,
    classified: 0,
    explicitNeed: 0,
    possibleNeed: 0,
    irrelevant: 0,
    unclassified: 0,
    errors: 0,
  };
}

function incrementClassificationBucket(
  row: MutableRow,
  classification: IntentClassification
): void {
  if (classification === "explicitNeed") {
    row.explicitNeed += 1;
  } else if (classification === "possibleNeed") {
    row.possibleNeed += 1;
  } else if (classification === "irrelevant") {
    row.irrelevant += 1;
  } else {
    row.unclassified += 1;
  }
}

export function createDiscoveryProfileMetricsTracker(
  profiles: DiscoverySearchProfile[]
): DiscoveryProfileMetricsTracker {
  const rows = new Map<string, MutableRow>();

  for (const profile of profiles) {
    if (rows.size >= MAX_DISCOVERY_RUN_PROFILE_SUMMARIES) {
      break;
    }
    rows.set(profile.id, createEmptyRow(profile.id, profile.queryHe));
  }

  function getOrCreate(profileId: string, query: string): MutableRow | null {
    const existing = rows.get(profileId);
    if (existing) {
      return existing;
    }
    if (rows.size >= MAX_DISCOVERY_RUN_PROFILE_SUMMARIES) {
      return null;
    }
    const row = createEmptyRow(profileId, query);
    rows.set(profileId, row);
    return row;
  }

  return {
    recordProfileSearch(profileId, query, input) {
      const row = getOrCreate(profileId, query);
      if (!row) {
        return;
      }
      row.raw += input.raw;
      row.afterFilter += input.afterFilter;
    },

    recordProfileRequestError(profileId, query) {
      const row = getOrCreate(profileId, query);
      if (!row) {
        return;
      }
      row.errors += 1;
    },

    recordUniqueAttributedCandidates(candidates) {
      for (const candidate of candidates) {
        const row = rows.get(candidate.profileId);
        if (!row) {
          continue;
        }
        row.uniqueAttributed += 1;
      }
    },

    recordIngestOutcome(profileId, outcome) {
      const row = rows.get(profileId);
      if (!row) {
        return;
      }

      if (!outcome.ok) {
        row.errors += 1;
        return;
      }

      if (outcome.created) {
        row.created += 1;
      } else {
        row.rediscovered += 1;
      }

      if (outcome.classified) {
        row.classified += 1;
      }

      incrementClassificationBucket(row, outcome.classification);
    },

    toSummaries() {
      return [...rows.values()];
    },
  };
}
