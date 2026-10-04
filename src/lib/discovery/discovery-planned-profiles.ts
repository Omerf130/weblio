import { selectDailyDiscoveryProfiles } from "@/lib/discovery/discovery-daily-profile-selector";
import type { DiscoveryPolicy } from "@/lib/discovery/discovery-policy";
import { isDiscoveryCatalogV2 } from "@/lib/discovery/discovery-v2-types";
import type { DiscoverySearchProfileCatalog } from "@/lib/discovery/providers/types";

/** Logical Tavily profile searches planned for a run (V2.2 daily selection). */
export function countPlannedTavilyProfileSearches(input: {
  catalog: DiscoverySearchProfileCatalog;
  policy: DiscoveryPolicy;
  referenceDate?: Date;
}): number {
  const referenceDate = input.referenceDate ?? new Date();

  if (isDiscoveryCatalogV2(input.catalog)) {
    const selection = selectDailyDiscoveryProfiles(input.catalog, referenceDate);
    const cap = Math.min(
      input.policy.limits.maxProfilesPerRun,
      input.policy.limits.maxTavilyRequestsPerRun,
      selection.selected.length
    );
    return Math.max(0, cap);
  }

  const cap = Math.min(
    input.policy.limits.maxProfilesPerRun,
    input.policy.limits.maxTavilyRequestsPerRun,
    input.catalog.profiles.length
  );
  return Math.max(0, cap);
}

/** Worst-case Tavily HTTP POST count (2 attempts per profile search). */
export function worstCaseTavilyHttpAttempts(plannedProfileCount: number): number {
  if (plannedProfileCount <= 0) {
    return 0;
  }
  return plannedProfileCount * 2;
}
