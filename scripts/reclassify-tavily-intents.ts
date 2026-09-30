import { runReclassifyTavilyIntents } from "@/lib/business/intents/reclassify-tavily-intents";
import { getDiscoveryRunById } from "@/lib/data/discovery-runs";
import { listTavilyIntentsInDiscoveryRunWindow } from "@/lib/data/reclassify-tavily-candidates";
import { updateIntentClassification } from "@/lib/data/intents";

function parseArgs(argv: string[]): { discoveryRunId?: string; apply: boolean } {
  let discoveryRunId: string | undefined;
  let apply = false;

  for (const arg of argv) {
    if (arg === "--apply") {
      apply = true;
      continue;
    }
    if (arg.startsWith("--discovery-run-id=")) {
      discoveryRunId = arg.slice("--discovery-run-id=".length).trim();
    }
  }

  return { discoveryRunId, apply };
}

function printSummary(summary: Awaited<ReturnType<typeof runReclassifyTavilyIntents>>): void {
  console.log(`Mode: ${summary.mode}`);
  console.log(`Discovery run: ${summary.discoveryRunId}`);
  if (summary.windowStart && summary.windowEnd) {
    console.log(`Window: ${summary.windowStart} → ${summary.windowEnd}`);
  }
  if (summary.aborted) {
    console.log(`ABORTED: ${summary.abortReason ?? "unknown"}`);
  }
  console.log(`Targeted in window (provider=tavily): ${summary.targeted}`);
  console.log(`Eligible for reclassification: ${summary.eligible}`);
  console.log(`Skipped: ${summary.skipped}`);
  if (summary.mode === "apply") {
    console.log(`Classified: ${summary.classified}`);
    console.log(`explicitNeed: ${summary.explicitNeed}`);
    console.log(`possibleNeed: ${summary.possibleNeed}`);
    console.log(`irrelevant: ${summary.irrelevant}`);
    console.log(`Failed: ${summary.failed}`);
  }

  console.log("");
  console.log("Rows:");
  for (const row of summary.rows) {
    const skip = row.eligible ? "ELIGIBLE" : `SKIP:${row.skipReason ?? "unknown"}`;
    console.log(
      `- ${row.id} | ${skip} | ${row.classification} | ${row.classifierVersion ?? "(none)"} | ${row.discoveredAt} | ${row.titlePreview}`
    );
  }

  if (summary.eligible > 26) {
    console.log("");
    console.log(
      "WARNING: More than 26 eligible intents. APPLY would abort. Narrow scope or confirm DiscoveryRun id."
    );
  }
}

async function main(): Promise<void> {
  const { discoveryRunId, apply } = parseArgs(process.argv.slice(2));

  if (!discoveryRunId) {
    console.error(
      "Usage: tsx --env-file=.env.local scripts/reclassify-tavily-intents.ts --discovery-run-id=<id> [--apply]"
    );
    console.error("Default mode is DRY RUN (no OpenAI, no writes).");
    process.exit(1);
  }

  const summary = await runReclassifyTavilyIntents({
    discoveryRunId,
    apply,
    deps: {
      loadDiscoveryRun: getDiscoveryRunById,
      listTavilyCandidates: listTavilyIntentsInDiscoveryRunWindow,
      updateClassification: async (input) => {
        const updated = await updateIntentClassification(input);
        return Boolean(updated);
      },
    },
  });

  printSummary(summary);

  if (summary.aborted && apply) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(
    `Reclassification failed: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});
