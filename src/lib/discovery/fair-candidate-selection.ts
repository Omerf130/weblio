import type { PreIngestCandidate } from "@/lib/discovery/pre-ingest-filter";
import type { DiscoveryIntentStrength } from "@/lib/discovery/discovery-v2-types";

export type ProfileIntentMeta = {
  intentStrength: DiscoveryIntentStrength;
};

const STRENGTH_RANK: Record<DiscoveryIntentStrength, number> = {
  high: 0,
  medium: 1,
  exploratory: 2,
};

const DEFAULT_PER_PROFILE_CAP = 4;

function readTavilyScore(candidate: PreIngestCandidate): number {
  const raw = candidate.normalized.rawMetadata?.score;
  return typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
}

function groupByProfile(
  candidates: PreIngestCandidate[]
): Map<string, PreIngestCandidate[]> {
  const map = new Map<string, PreIngestCandidate[]>();
  for (const candidate of candidates) {
    const list = map.get(candidate.profileId) ?? [];
    list.push(candidate);
    map.set(candidate.profileId, list);
  }
  return map;
}

function profileOrder(
  profileIds: string[],
  metaByProfileId: Map<string, ProfileIntentMeta>
): string[] {
  return [...profileIds].sort((a, b) => {
    const rankA = STRENGTH_RANK[metaByProfileId.get(a)?.intentStrength ?? "medium"];
    const rankB = STRENGTH_RANK[metaByProfileId.get(b)?.intentStrength ?? "medium"];
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    return a.localeCompare(b, "en");
  });
}

export type FairCandidateSelectionOptions = {
  globalCap: number;
  perProfileCap?: number;
  profileMeta: Map<string, ProfileIntentMeta>;
};

/**
 * After in-run dedupe: limit per profile, then round-robin across profiles (high tier first).
 */
export function selectCandidatesWithFairCap(
  uniqueCandidates: PreIngestCandidate[],
  options: FairCandidateSelectionOptions
): PreIngestCandidate[] {
  const perProfileCap = options.perProfileCap ?? DEFAULT_PER_PROFILE_CAP;
  const globalCap = options.globalCap;

  if (uniqueCandidates.length <= globalCap) {
    return uniqueCandidates;
  }

  const grouped = groupByProfile(uniqueCandidates);
  const queues = new Map<string, PreIngestCandidate[]>();

  for (const [profileId, rows] of grouped) {
    const sorted = [...rows].sort((a, b) => readTavilyScore(b) - readTavilyScore(a));
    queues.set(profileId, sorted.slice(0, perProfileCap));
  }

  const orderedProfiles = profileOrder([...queues.keys()], options.profileMeta);
  const result: PreIngestCandidate[] = [];
  let progressed = true;

  while (result.length < globalCap && progressed) {
    progressed = false;
    for (const profileId of orderedProfiles) {
      const queue = queues.get(profileId);
      if (!queue || queue.length === 0) {
        continue;
      }
      const next = queue.shift();
      if (next) {
        result.push(next);
        progressed = true;
        if (result.length >= globalCap) {
          break;
        }
      }
    }
  }

  return result;
}

export type ClassificationOrderOptions = {
  maxClassifications: number;
  profileMeta: Map<string, ProfileIntentMeta>;
};

/** Reorder candidates so classification cap favors high-intent profiles fairly. */
export function orderCandidatesForClassificationPass(
  candidates: PreIngestCandidate[],
  options: ClassificationOrderOptions
): PreIngestCandidate[] {
  void options.maxClassifications;
  const grouped = groupByProfile(candidates);
  const queues = new Map<string, PreIngestCandidate[]>();

  for (const [profileId, rows] of grouped) {
    const sorted = [...rows].sort((a, b) => readTavilyScore(b) - readTavilyScore(a));
    queues.set(profileId, sorted);
  }

  const orderedProfiles = profileOrder([...queues.keys()], options.profileMeta);
  const result: PreIngestCandidate[] = [];
  let progressed = true;

  while (progressed) {
    progressed = false;
    for (const profileId of orderedProfiles) {
      const queue = queues.get(profileId);
      if (!queue || queue.length === 0) {
        continue;
      }
      const next = queue.shift();
      if (next) {
        result.push(next);
        progressed = true;
      }
    }
  }

  return result;
}
