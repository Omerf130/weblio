import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_TAVILY_MAX_RESULTS } from "@/lib/discovery/providers/tavily-env";
import { loadSearchProfileCatalog } from "@/lib/discovery/providers/load-search-profiles";
import { createTavilySearchProviderFromEnv } from "@/lib/discovery/providers/tavily-search-provider";
import { markDuplicateUrls } from "@/lib/discovery/poc/duplicate-urls";
import {
  buildTavilyPocReportMarkdown,
  computeTavilyPocTotals,
  type TavilyPocRunArtifact,
} from "@/lib/discovery/poc/poc-report";

function formatTimestampForPath(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

async function runTavilyPoc(): Promise<void> {
  const provider = createTavilySearchProviderFromEnv();
  if (!provider) {
    console.error(
      "TAVILY_API_KEY is missing. Set it in .env.local before running the live PoC."
    );
    process.exit(1);
  }

  const catalog = loadSearchProfileCatalog();
  const runAt = new Date();
  const runDir = join(
    process.cwd(),
    "artifacts",
    "discovery-poc",
    formatTimestampForPath(runAt)
  );
  mkdirSync(runDir, { recursive: true });

  const seenAcrossRun = new Set<string>();
  const profileResults = [];

  for (const profile of catalog.profiles) {
    console.log(`Searching profile ${profile.id}: ${profile.queryHe}`);
    const result = await provider.search(profile, {
      maxResults: DEFAULT_TAVILY_MAX_RESULTS,
    });
    markDuplicateUrls(result.rows, seenAcrossRun);
    profileResults.push(result);
  }

  const artifact: TavilyPocRunArtifact = {
    runAt: runAt.toISOString(),
    provider: "tavily",
    catalogVersion: catalog.version,
    profileCount: catalog.profiles.length,
    maxResultsPerQuery: DEFAULT_TAVILY_MAX_RESULTS,
    apiSearchRequests: catalog.profiles.length,
    totals: computeTavilyPocTotals(profileResults),
    profiles: profileResults,
  };

  const jsonPath = join(runDir, "tavily-results.json");
  const mdPath = join(runDir, "tavily-report.md");
  const reportMarkdown = buildTavilyPocReportMarkdown(artifact);

  writeFileSync(jsonPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  writeFileSync(mdPath, reportMarkdown, "utf8");

  console.log("Tavily PoC complete (no MongoDB, no OpenAI, no ingest).");
  console.log(`Profiles: ${artifact.profileCount}`);
  console.log(`API search requests: ${artifact.apiSearchRequests}`);
  console.log(`Raw results: ${artifact.totals.rawResults}`);
  console.log(`Validation passed: ${artifact.totals.validationPassed}`);
  console.log(`Artifact JSON: ${jsonPath}`);
  console.log(`Report MD: ${mdPath}`);
}

runTavilyPoc().catch((error) => {
  console.error(
    `Tavily PoC failed: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});
