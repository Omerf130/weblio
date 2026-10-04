import type { DiscoverySearchProfile } from "@/lib/discovery/providers/types";

export const DISCOVERY_PROFILE_TIERS = ["core", "rotating", "experimental"] as const;
export type DiscoveryProfileTier = (typeof DISCOVERY_PROFILE_TIERS)[number];

export const DISCOVERY_INTENT_STRENGTHS = ["high", "medium", "exploratory"] as const;
export type DiscoveryIntentStrength = (typeof DISCOVERY_INTENT_STRENGTHS)[number];

export type DiscoverySearchProfileV2 = DiscoverySearchProfile & {
  enabled: boolean;
  tier: DiscoveryProfileTier;
  intentStrength: DiscoveryIntentStrength;
  rotationGroup?: number;
};

export type DiscoverySearchProfileCatalogV2 = {
  version: number;
  locale: string;
  environment?: string;
  strategy?: string;
  catalogKind: "v2";
  profiles: DiscoverySearchProfileV2[];
};

export function isDiscoveryCatalogV2(catalog: {
  catalogKind?: string;
  environment?: string;
  version?: number;
}): catalog is DiscoverySearchProfileCatalogV2 {
  return (
    catalog.catalogKind === "v2" ||
    catalog.environment === "production-v2" ||
    catalog.environment === "production-v2.2" ||
    catalog.version === 3 ||
    catalog.version === 4
  );
}
