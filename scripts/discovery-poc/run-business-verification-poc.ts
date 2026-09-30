import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  assertBusinessVerificationReportContainsNoSecrets,
  buildBusinessVerificationReportMarkdown,
} from "@/lib/discovery/poc/business-verification/business-verification-report";
import { runBusinessVerificationPoc } from "@/lib/discovery/poc/business-verification/business-verification-poc-run";
import { getGooglePlacesApiKey } from "@/lib/discovery/poc/business-verification/google-places-env";
import { getTavilyApiKey } from "@/lib/discovery/providers/tavily-env";

function formatTimestampForPath(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

async function main(): Promise<void> {
  const googleKey = getGooglePlacesApiKey();
  if (!googleKey) {
    console.error(
      "GOOGLE_PLACES_API_KEY is missing. Set it in .env.local before running the live PoC."
    );
    process.exit(1);
  }

  const tavilyKey = getTavilyApiKey();
  if (!tavilyKey) {
    console.error(
      "TAVILY_API_KEY is missing. Set it in .env.local before running the live PoC."
    );
    process.exit(1);
  }

  const runAt = new Date();
  const runDir = join(
    process.cwd(),
    "artifacts",
    "discovery-poc",
    "business-verification",
    formatTimestampForPath(runAt)
  );
  mkdirSync(runDir, { recursive: true });

  const { artifact } = await runBusinessVerificationPoc({
    google: { apiKey: googleKey },
    tavily: { apiKey: tavilyKey },
  });

  artifact.runAt = runAt.toISOString();

  const jsonPath = join(runDir, "results.json");
  const mdPath = join(runDir, "report.md");
  const reportMarkdown = buildBusinessVerificationReportMarkdown(artifact);
  assertBusinessVerificationReportContainsNoSecrets(reportMarkdown);
  assertBusinessVerificationReportContainsNoSecrets(JSON.stringify(artifact));

  writeFileSync(jsonPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  writeFileSync(mdPath, reportMarkdown, "utf8");

  console.log("Business Discovery verification PoC complete (no MongoDB, no OpenAI).");
  console.log(`Places Text Search requests: ${artifact.google.textSearchRequests}`);
  console.log(`Tavily verification requests: ${artifact.tavily.verificationRequests}`);
  console.log(`Final inbox-eligible candidates: ${artifact.finalCandidates.length}`);
  console.log(`Artifact JSON: ${jsonPath}`);
  console.log(`Report MD: ${mdPath}`);
}

main().catch((error) => {
  console.error(
    `Business verification PoC failed: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});
