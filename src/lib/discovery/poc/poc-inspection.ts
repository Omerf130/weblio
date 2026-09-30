import { rowDedupeKey } from "@/lib/discovery/poc/duplicate-urls";
import {
  categorizePocDomain,
  type PocDomainCategory,
} from "@/lib/discovery/poc/domain-category";

const POC_DOMAIN_CATEGORIES: PocDomainCategory[] = [
  "social",
  "forum/community",
  "video",
  "service/business-site",
  "other",
];

function isPocDomainCategory(value: string): value is PocDomainCategory {
  return (POC_DOMAIN_CATEGORIES as string[]).includes(value);
}
import type { DiscoveryProviderMappedRow } from "@/lib/discovery/providers/types";
import type { DiscoveryProviderSearchResult } from "@/lib/discovery/providers/types";

export type PocInspectionTotals = {
  uniqueUrls: number;
  duplicateUrlRows: number;
  uniqueDomains: number;
  social: number;
  forumCommunity: number;
  video: number;
  serviceBusinessSite: number;
  other: number;
};

export type PocTopDomainEntry = {
  domain: string;
  count: number;
};

export function assignDomainCategoriesToRows(rows: DiscoveryProviderMappedRow[]): void {
  for (const row of rows) {
    row.domainCategory = categorizePocDomain(row.domain ?? row.url);
  }
}

export function computePocInspectionTotals(
  profiles: DiscoveryProviderSearchResult[]
): { totals: PocInspectionTotals; topDomains: PocTopDomainEntry[] } {
  const uniqueUrlKeys = new Set<string>();
  const uniqueDomains = new Set<string>();
  const domainCounts = new Map<string, number>();

  let duplicateUrlRows = 0;
  const categoryCounts: Record<PocDomainCategory, number> = {
    social: 0,
    "forum/community": 0,
    video: 0,
    "service/business-site": 0,
    other: 0,
  };

  for (const profile of profiles) {
    for (const row of profile.rows) {
      const key = rowDedupeKey(row) ?? row.url?.trim();
      if (key) {
        uniqueUrlKeys.add(key);
      }

      if (row.duplicateWithinProfile || row.duplicateAcrossProfiles) {
        duplicateUrlRows += 1;
      }

      const domain = row.domain?.trim().toLowerCase();
      if (domain) {
        uniqueDomains.add(domain);
        domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
      }

      const category: PocDomainCategory =
        row.domainCategory && isPocDomainCategory(row.domainCategory)
          ? row.domainCategory
          : categorizePocDomain(row.domain ?? row.url);
      categoryCounts[category] += 1;
    }
  }

  const topDomains = [...domainCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 15)
    .map(([domain, count]) => ({ domain, count }));

  return {
    totals: {
      uniqueUrls: uniqueUrlKeys.size,
      duplicateUrlRows,
      uniqueDomains: uniqueDomains.size,
      social: categoryCounts.social,
      forumCommunity: categoryCounts["forum/community"],
      video: categoryCounts.video,
      serviceBusinessSite: categoryCounts["service/business-site"],
      other: categoryCounts.other,
    },
    topDomains,
  };
}
