import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import type { DiscoverySearchProfileCatalogV2 } from "@/lib/discovery/discovery-v2-types";
import { parseSearchProfileCatalogV2 } from "@/lib/discovery/providers/validate-v2-search-catalog";
import type { DiscoverySearchProfileCatalog } from "@/lib/discovery/providers/types";

const profileSchema = z.object({
  id: z.string().trim().min(1).max(16),
  category: z.string().trim().min(1).max(64),
  queryHe: z.string().trim().min(1).max(400),
  notes: z.string().trim().max(500).optional(),
});

const catalogSchema = z.object({
  version: z.number().int().positive(),
  locale: z.string().trim().min(2).max(16),
  environment: z.string().trim().min(1).max(32).optional(),
  pocVersion: z.number().int().positive().optional(),
  strategy: z.string().trim().min(1).max(120).optional(),
  profiles: z.array(profileSchema).min(1),
});

export const POC1_CATALOG_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../config/discovery/search-profiles.he.json"
);

export const POC2_CATALOG_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../config/discovery/search-profiles.he.poc2.json"
);

export const PRODUCTION_CATALOG_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../config/discovery/search-profiles.he.prod.json"
);

export const PRODUCTION_V2_CATALOG_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../config/discovery/search-profiles.he.v2.prod.json"
);

const DEFAULT_CATALOG_PATH = POC1_CATALOG_PATH;

export function parseSearchProfileCatalog(
  value: unknown
): DiscoverySearchProfileCatalog {
  return catalogSchema.parse(value);
}

export function loadSearchProfileCatalog(
  catalogPath: string = DEFAULT_CATALOG_PATH
): DiscoverySearchProfileCatalog {
  const raw = readFileSync(catalogPath, "utf8");
  const json = JSON.parse(raw) as unknown;
  return parseSearchProfileCatalog(json);
}

export function loadSearchProfileCatalogPoc1(): DiscoverySearchProfileCatalog {
  return loadSearchProfileCatalog(POC1_CATALOG_PATH);
}

export function loadSearchProfileCatalogPoc2(): DiscoverySearchProfileCatalog {
  return loadSearchProfileCatalog(POC2_CATALOG_PATH);
}

export function loadSearchProfileCatalogProduction(): DiscoverySearchProfileCatalog {
  return loadSearchProfileCatalog(PRODUCTION_CATALOG_PATH);
}

export function loadSearchProfileCatalogV2Production(): DiscoverySearchProfileCatalogV2 {
  const raw = readFileSync(PRODUCTION_V2_CATALOG_PATH, "utf8");
  const json = JSON.parse(raw) as unknown;
  return parseSearchProfileCatalogV2(json);
}
