import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadSearchProfileCatalogPoc2 } from "@/lib/discovery/providers/load-search-profiles";
import { buildTavilyPocReportMarkdown } from "@/lib/discovery/poc/poc-report";
import { runTavilyDiscoveryPoc } from "@/lib/discovery/poc/tavily-poc-run";

function formatTimestampForPath(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

async function runTavilyPoc2(): Promise<void> {
  const catalog = loadSearchProfileCatalogPoc2();
  const runAt = new Date();
  const runDir = join(
    process.cwd(),
    "artifacts",
    "discovery-poc",
    "poc-2",
    formatTimestampForPath(runAt)
  );
  mkdirSync(runDir, { recursive: true });

  let artifact;
  try {
    ({ artifact } = await runTavilyDiscoveryPoc({
      catalog,
      pocVersion: catalog.pocVersion ?? 2,
      strategy: catalog.strategy ?? "explicit-intent-focused",
      withDomainInspection: true,
    }));
  } catch (error) {
    if (error instanceof Error && error.message === "TAVILY_API_KEY_MISSING") {
      console.error(
        "TAVILY_API_KEY is missing. Set it in .env.local before running the live PoC."
      );
      process.exit(1);
    }
    throw error;
  }

  artifact.runAt = runAt.toISOString();

  const jsonPath = join(runDir, "tavily-results.json");
  const mdPath = join(runDir, "tavily-report.md");
  const reportMarkdown = buildTavilyPocReportMarkdown(artifact);

  writeFileSync(jsonPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  writeFileSync(mdPath, reportMarkdown, "utf8");

  console.log("Tavily Discovery PoC #2 complete (no MongoDB, no OpenAI, no ingest).");
  console.log(`PoC version: ${artifact.pocVersion ?? 2}`);
  console.log(`Strategy: ${artifact.strategy ?? "explicit-intent-focused"}`);
  console.log(`Profiles: ${artifact.profileCount}`);
  console.log(`API search requests: ${artifact.apiSearchRequests}`);
  console.log(`Raw results: ${artifact.totals.rawResults}`);
  console.log(`Artifact JSON: ${jsonPath}`);
  console.log(`Report MD: ${mdPath}`);
}

runTavilyPoc2().catch((error) => {
  console.error(
    `Tavily PoC #2 failed: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});
