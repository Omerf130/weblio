import { computeDedupeKey } from "@/lib/discovery/dedupe-key";
import type { NormalizedDiscoveryInput } from "@/lib/discovery/types";
import type { PreIngestCandidate } from "@/lib/discovery/pre-ingest-filter";

/** In-run identity aligned with Mongo persistence (URL-first for Tavily-mapped rows). */
export function runCandidatePersistKey(normalized: NormalizedDiscoveryInput): string {
  return computeDedupeKey({
    provider: normalized.provider,
    externalId: normalized.externalId,
    sourceUrl: normalized.sourceUrl,
  });
}

export function dedupeRunCandidates(
  candidates: PreIngestCandidate[]
): {
  unique: PreIngestCandidate[];
  filteredDuplicateInRun: number;
} {
  const seen = new Set<string>();
  const unique: PreIngestCandidate[] = [];
  let filteredDuplicateInRun = 0;

  for (const candidate of candidates) {
    let key: string;
    try {
      key = runCandidatePersistKey(candidate.normalized);
    } catch {
      filteredDuplicateInRun += 1;
      continue;
    }

    if (seen.has(key)) {
      filteredDuplicateInRun += 1;
      continue;
    }

    seen.add(key);
    unique.push(candidate);
  }

  return { unique, filteredDuplicateInRun };
}
