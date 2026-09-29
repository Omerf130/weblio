import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assertDatabaseNameInUri, getDatabaseEnv } from "@/lib/env";
import { connectDB, disconnectDB } from "@/lib/db/mongoose";
import { ingestDiscoveredResults } from "@/lib/discovery/ingest";
import type { NormalizedDiscoveryInput } from "@/lib/discovery/types";

type FixtureRecord = Omit<NormalizedDiscoveryInput, "publishedAt"> & {
  publishedAt?: string;
};

const scriptDir = dirname(fileURLToPath(import.meta.url));
const fixturesPath = join(scriptDir, "fixtures", "intent-samples.json");

function loadFixtures(): NormalizedDiscoveryInput[] {
  const raw = readFileSync(fixturesPath, "utf8");
  const records = JSON.parse(raw) as FixtureRecord[];

  return records.map((record) => ({
    ...record,
    publishedAt: record.publishedAt ? new Date(record.publishedAt) : undefined,
  }));
}

async function seedIntents(): Promise<void> {
  const { MONGODB_URI } = getDatabaseEnv();
  assertDatabaseNameInUri(MONGODB_URI);

  await connectDB();

  const fixtures = loadFixtures();
  const summary = await ingestDiscoveredResults(fixtures);

  console.log("Intent seed complete (via ingestion pipeline):");
  console.log(`Received: ${summary.received}`);
  console.log(`Created: ${summary.created}`);
  console.log(`Rediscovered: ${summary.rediscovered}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`Classified: ${summary.classified}`);

  if (summary.failures.length > 0) {
    for (const failure of summary.failures) {
      console.warn(
        `Failure at index ${failure.index}: ${failure.code} — ${failure.message}`
      );
    }
  }

  await disconnectDB();
  process.exit(summary.failed > 0 ? 1 : 0);
}

seedIntents().catch(async (error) => {
  console.error(
    `Intent seed failed: ${error instanceof Error ? error.message : String(error)}`
  );
  await disconnectDB().catch(() => undefined);
  process.exit(1);
});
