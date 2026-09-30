import { createTavilySearchProviderFromEnv } from "@/lib/discovery/providers/tavily-search-provider";
import { DEFAULT_TAVILY_MAX_RESULTS } from "@/lib/discovery/providers/tavily-env";
import type { DiscoverySearchProfileCatalog } from "@/lib/discovery/providers/types";
import { markDuplicateUrls } from "@/lib/discovery/poc/duplicate-urls";
import {
  assignDomainCategoriesToRows,
  computePocInspectionTotals,
  type PocInspectionTotals,
  type PocTopDomainEntry,
} from "@/lib/discovery/poc/poc-inspection";
import {
  computeTavilyPocTotals,
  type TavilyPocRunArtifact,
} from "@/lib/discovery/poc/poc-report";

export type RunTavilyPocParams = {
  catalog: DiscoverySearchProfileCatalog;
  pocVersion?: number;
  strategy?: string;
  withDomainInspection: boolean;
};

export type RunTavilyPocResult = {
  artifact: TavilyPocRunArtifact;
};

export async function runTavilyDiscoveryPoc(
  params: RunTavilyPocParams
): Promise<RunTavilyPocResult> {
  const provider = createTavilySearchProviderFromEnv();
  if (!provider) {
    throw new Error("TAVILY_API_KEY_MISSING");
  }

  const { catalog } = params;
  const seenAcrossRun = new Set<string>();
  const profileResults = [];

  for (const profile of catalog.profiles) {
    const result = await provider.search(profile, {
      maxResults: DEFAULT_TAVILY_MAX_RESULTS,
    });
    markDuplicateUrls(result.rows, seenAcrossRun);
    if (params.withDomainInspection) {
      assignDomainCategoriesToRows(result.rows);
    }
    profileResults.push(result);
  }

  let inspection: (PocInspectionTotals & { topDomains: PocTopDomainEntry[] }) | undefined;
  if (params.withDomainInspection) {
    const { totals, topDomains } = computePocInspectionTotals(profileResults);
    inspection = { ...totals, topDomains };
  }

  const artifact: TavilyPocRunArtifact = {
    runAt: new Date().toISOString(),
    provider: "tavily",
    catalogVersion: catalog.version,
    pocVersion: params.pocVersion ?? catalog.pocVersion,
    strategy: params.strategy ?? catalog.strategy,
    profileCount: catalog.profiles.length,
    maxResultsPerQuery: DEFAULT_TAVILY_MAX_RESULTS,
    apiSearchRequests: catalog.profiles.length,
    totals: computeTavilyPocTotals(profileResults),
    inspection,
    profiles: profileResults,
  };

  return { artifact };
}
