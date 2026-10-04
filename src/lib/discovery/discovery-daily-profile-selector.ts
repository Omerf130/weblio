import { getIsraelCalendarDayNumber } from "@/lib/admin/israel-calendar-date";
import type {
  DiscoveryProfileTier,
  DiscoverySearchProfileCatalogV2,
  DiscoverySearchProfileV2,
} from "@/lib/discovery/discovery-v2-types";

export type DailyProfileSelectionTargets = {
  core: number;
  rotating: number;
  experimental: number;
};

/** V2.2 quality-first daily budget (~15 Tavily requests). */
export const DEFAULT_V2_DAILY_SELECTION_TARGETS: DailyProfileSelectionTargets = {
  core: 9,
  rotating: 4,
  experimental: 2,
};

export type DailyProfileSelectionResult = {
  selected: DiscoverySearchProfileV2[];
  selectedProfileIds: string[];
  targets: DailyProfileSelectionTargets;
  shortfall: {
    core: number;
    rotating: number;
    experimental: number;
    total: number;
  };
  israelDayNumber: number;
};

function sortById(profiles: DiscoverySearchProfileV2[]): DiscoverySearchProfileV2[] {
  return [...profiles].sort((a, b) => a.id.localeCompare(b.id, "en"));
}

function pickRotatingWindow(
  pool: DiscoverySearchProfileV2[],
  count: number,
  dayNumber: number
): DiscoverySearchProfileV2[] {
  if (pool.length === 0 || count <= 0) {
    return [];
  }
  const sorted = sortById(pool);
  const start = dayNumber % sorted.length;
  const picked: DiscoverySearchProfileV2[] = [];
  for (let i = 0; i < Math.min(count, sorted.length); i += 1) {
    picked.push(sorted[(start + i) % sorted.length]!);
  }
  return picked;
}

function enabledInTier(
  catalog: DiscoverySearchProfileCatalogV2,
  tier: DiscoveryProfileTier
): DiscoverySearchProfileV2[] {
  return catalog.profiles.filter((p) => p.enabled && p.tier === tier);
}

export function selectDailyDiscoveryProfiles(
  catalog: DiscoverySearchProfileCatalogV2,
  referenceDate = new Date(),
  targets: DailyProfileSelectionTargets = DEFAULT_V2_DAILY_SELECTION_TARGETS
): DailyProfileSelectionResult {
  const dayNumber = getIsraelCalendarDayNumber(referenceDate);

  const corePool = sortById(enabledInTier(catalog, "core"));
  const rotatingPool = enabledInTier(catalog, "rotating");
  const experimentalPool = enabledInTier(catalog, "experimental");

  const coreSelected = corePool.slice(0, targets.core);
  const rotatingSelected = pickRotatingWindow(rotatingPool, targets.rotating, dayNumber);
  const experimentalSelected = pickRotatingWindow(
    experimentalPool,
    targets.experimental,
    Math.floor(dayNumber / 2)
  );

  const selected = [...coreSelected, ...rotatingSelected, ...experimentalSelected];
  const selectedProfileIds = selected.map((p) => p.id);

  const shortfallCore = Math.max(0, targets.core - coreSelected.length);
  const shortfallRotating = Math.max(0, targets.rotating - rotatingSelected.length);
  const shortfallExperimental = Math.max(0, targets.experimental - experimentalSelected.length);

  return {
    selected,
    selectedProfileIds,
    targets,
    shortfall: {
      core: shortfallCore,
      rotating: shortfallRotating,
      experimental: shortfallExperimental,
      total: shortfallCore + shortfallRotating + shortfallExperimental,
    },
    israelDayNumber: dayNumber,
  };
}
