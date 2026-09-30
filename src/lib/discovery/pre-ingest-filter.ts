import { isExcludedDiscoverySourceUrl } from "@/lib/discovery/excluded-discovery-domains";
import type { DiscoveryProviderMappedRow } from "@/lib/discovery/providers/types";
import type { NormalizedDiscoveryInput } from "@/lib/discovery/types";

export type PreIngestFilterReason = "mapping" | "validation" | "excluded_domain";

export type PreIngestFilterCounts = {
  filteredMapping: number;
  filteredValidation: number;
  filteredDomain: number;
};

export type PreIngestCandidate = {
  normalized: NormalizedDiscoveryInput;
  profileId: string;
};

const EMPTY_FILTER_COUNTS: PreIngestFilterCounts = {
  filteredMapping: 0,
  filteredValidation: 0,
  filteredDomain: 0,
};

export function createEmptyPreIngestFilterCounts(): PreIngestFilterCounts {
  return { ...EMPTY_FILTER_COUNTS };
}

export function mergePreIngestFilterCounts(
  target: PreIngestFilterCounts,
  delta: PreIngestFilterCounts
): void {
  target.filteredMapping += delta.filteredMapping;
  target.filteredValidation += delta.filteredValidation;
  target.filteredDomain += delta.filteredDomain;
}

export function filterMappedRowsForIngest(
  rows: DiscoveryProviderMappedRow[],
  profileId: string,
  excludedDomains: readonly string[]
): { candidates: PreIngestCandidate[]; counts: PreIngestFilterCounts } {
  const counts = createEmptyPreIngestFilterCounts();
  const candidates: PreIngestCandidate[] = [];

  for (const row of rows) {
    if (!row.normalized || row.skipReason) {
      counts.filteredMapping += 1;
      continue;
    }

    if (!row.validation.ok) {
      counts.filteredValidation += 1;
      continue;
    }

    if (
      isExcludedDiscoverySourceUrl(row.normalized.sourceUrl, excludedDomains)
    ) {
      counts.filteredDomain += 1;
      continue;
    }

    candidates.push({ normalized: row.normalized, profileId });
  }

  return { candidates, counts };
}
