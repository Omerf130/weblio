/**
 * One-time optional backfill for audited Oct 4 V2.2 classify-first Intent.
 *
 * Usage (manual only — do not run in CI):
 *   npx tsx --env-file=.env.local scripts/backfill-intent-provenance-oct4-v22.ts
 */
import mongoose from "mongoose";
import { DISCOVERY_INGEST_PATH_CLASSIFIED_FIRST } from "@/lib/discovery/discovery-ingest-path";
import { connectDB, disconnectDB } from "@/lib/db/mongoose";
import { Intent } from "@/models/Intent";

const TARGET_INTENT_ID = "6ac2163796fe4b2c70c5b897";
const TARGET_RUN_ID = "6ac215e996fe4b2c70c5b896";

const EXPECTED = {
  status: "new",
  classification: "possibleNeed",
  discoveryProfileId: "X02",
} as const;

async function main(): Promise<void> {
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(TARGET_INTENT_ID)) {
    throw new Error("INVALID_TARGET_INTENT_ID");
  }
  if (!mongoose.Types.ObjectId.isValid(TARGET_RUN_ID)) {
    throw new Error("INVALID_TARGET_RUN_ID");
  }

  const doc = await Intent.findById(TARGET_INTENT_ID);
  if (!doc) {
    throw new Error("INTENT_NOT_FOUND");
  }

  if (doc.status !== EXPECTED.status) {
    throw new Error(`UNEXPECTED_STATUS:${doc.status}`);
  }
  if (doc.classification !== EXPECTED.classification) {
    throw new Error(`UNEXPECTED_CLASSIFICATION:${doc.classification}`);
  }
  if (doc.discoveryProfileId !== EXPECTED.discoveryProfileId) {
    throw new Error(`UNEXPECTED_PROFILE:${doc.discoveryProfileId ?? "null"}`);
  }

  const runObjectId = new mongoose.Types.ObjectId(TARGET_RUN_ID);

  if (
    doc.discoveryIngestPath === DISCOVERY_INGEST_PATH_CLASSIFIED_FIRST &&
    doc.discoveryCreatedRunId?.equals(runObjectId)
  ) {
    console.log("Already backfilled — no changes.");
    await disconnectDB();
    return;
  }

  if (doc.discoveryIngestPath || doc.discoveryCreatedRunId) {
    throw new Error("INTENT_ALREADY_HAS_DIFFERENT_PROVENANCE");
  }

  doc.discoveryCreatedRunId = runObjectId;
  doc.discoveryIngestPath = DISCOVERY_INGEST_PATH_CLASSIFIED_FIRST;
  await doc.save();

  console.log("Backfill applied to single audited Intent.");
  await disconnectDB();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await disconnectDB();
  } catch {
    // ignore
  }
  process.exit(1);
});
