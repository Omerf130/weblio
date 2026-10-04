import { z } from "zod";
import {
  DISCOVERY_INTENT_STRENGTHS,
  DISCOVERY_PROFILE_TIERS,
  type DiscoverySearchProfileCatalogV2,
} from "@/lib/discovery/discovery-v2-types";

const ALLOWED_LATIN_TERMS = [
  "Shopify",
  "WooCommerce",
  "WordPress",
  "SEO",
  "Wix",
  "UX",
  "site:facebook.com",
  "site:instagram.com",
] as const;

/** Detect accidental Latin letters mixed into Hebrew (e.g. מישהu). */
const SUSPICIOUS_LATIN_IN_HEBREW_QUERY = /[\u0590-\u05FF][A-Za-z]|[A-Za-z][\u0590-\u05FF]/;

export const V2_PRODUCTION_CATALOG_PROFILE_COUNT = 49;
export const V2_CORE_PROFILE_COUNT = 9;
export const V2_ROTATING_PROFILE_COUNT = 28;
export const V2_EXPERIMENTAL_PROFILE_COUNT = 12;
export const V2_2_DISABLED_PROFILE_IDS = ["X06", "X08", "X09"] as const;

const profileV2Schema = z.object({
  id: z.string().trim().min(1).max(16),
  category: z.string().trim().min(1).max(64),
  queryHe: z.string().trim().min(1).max(400),
  notes: z.string().trim().max(500).optional(),
  enabled: z.boolean(),
  tier: z.enum(DISCOVERY_PROFILE_TIERS),
  intentStrength: z.enum(DISCOVERY_INTENT_STRENGTHS),
  rotationGroup: z.number().int().min(0).max(99).optional(),
});

export const catalogV2Schema = z.object({
  version: z.union([z.literal(3), z.literal(4)]),
  locale: z.string().trim().min(2).max(16),
  environment: z.union([z.literal("production-v2"), z.literal("production-v2.2")]),
  strategy: z.string().trim().min(1).max(120).optional(),
  catalogKind: z.literal("v2"),
  profiles: z.array(profileV2Schema).length(V2_PRODUCTION_CATALOG_PROFILE_COUNT),
});

export function validateHebrewQueryLatinMix(queryHe: string): string | null {
  if (SUSPICIOUS_LATIN_IN_HEBREW_QUERY.test(queryHe)) {
    return "QUERY_LATIN_HEBREW_MIX";
  }
  let remainder = queryHe;
  for (const term of ALLOWED_LATIN_TERMS) {
    remainder = remainder.split(term).join("");
  }
  if (/[A-Za-z]/.test(remainder)) {
    return "QUERY_UNEXPECTED_LATIN";
  }
  return null;
}

export function assertV2CatalogCounts(catalog: DiscoverySearchProfileCatalogV2): void {
  const core = catalog.profiles.filter((p) => p.tier === "core").length;
  const rotating = catalog.profiles.filter((p) => p.tier === "rotating").length;
  const experimental = catalog.profiles.filter((p) => p.tier === "experimental").length;

  if (core !== V2_CORE_PROFILE_COUNT) {
    throw new Error(`V2 catalog expected ${V2_CORE_PROFILE_COUNT} core profiles, got ${core}`);
  }
  if (rotating !== V2_ROTATING_PROFILE_COUNT) {
    throw new Error(
      `V2 catalog expected ${V2_ROTATING_PROFILE_COUNT} rotating profiles, got ${rotating}`
    );
  }
  if (experimental !== V2_EXPERIMENTAL_PROFILE_COUNT) {
    throw new Error(
      `V2 catalog expected ${V2_EXPERIMENTAL_PROFILE_COUNT} experimental profiles, got ${experimental}`
    );
  }

  const queries = catalog.profiles.map((p) => p.queryHe);
  if (new Set(queries).size !== queries.length) {
    throw new Error("V2 catalog contains duplicate exact queries");
  }

  const ids = catalog.profiles.map((p) => p.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("V2 catalog contains duplicate profile IDs");
  }

  for (const profile of catalog.profiles) {
    const latinIssue = validateHebrewQueryLatinMix(profile.queryHe);
    if (latinIssue) {
      throw new Error(`Profile ${profile.id}: ${latinIssue}`);
    }
  }
}

export function parseSearchProfileCatalogV2(value: unknown): DiscoverySearchProfileCatalogV2 {
  const parsed = catalogV2Schema.parse(value);
  assertV2CatalogCounts(parsed);
  return parsed;
}
