import type { DiscoveryProviderMappedRow } from "@/lib/discovery/providers/types";

export function rowDedupeKey(row: DiscoveryProviderMappedRow): string | undefined {
  if (row.dedupeUrlKey?.trim()) {
    return row.dedupeUrlKey.trim();
  }
  const externalId = row.normalized?.externalId?.trim();
  if (externalId && row.normalized?.provider) {
    return `provider:${row.normalized.provider}:${externalId}`;
  }
  return undefined;
}

export function markDuplicateUrls(
  rows: DiscoveryProviderMappedRow[],
  seenAcrossRun: Set<string>
): void {
  const seenInProfile = new Set<string>();

  for (const row of rows) {
    const key = rowDedupeKey(row);
    if (!key) {
      row.duplicateWithinProfile = false;
      row.duplicateAcrossProfiles = false;
      continue;
    }

    row.duplicateWithinProfile = seenInProfile.has(key);
    row.duplicateAcrossProfiles = seenAcrossRun.has(key);

    if (!seenInProfile.has(key)) {
      seenInProfile.add(key);
    }
    if (!seenAcrossRun.has(key)) {
      seenAcrossRun.add(key);
    }
  }
}
