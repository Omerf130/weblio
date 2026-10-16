/**
 * TTL index migration review helper for `website_analysis_runs`.
 *
 * DOES NOT run destructive steps unless `--apply` is passed.
 * DO NOT run `--apply` against production without backup and explicit approval.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/migrate-website-analysis-runs-ttl-index.mts
 *   npx tsx --env-file=.env.local scripts/migrate-website-analysis-runs-ttl-index.mts --apply
 */
import mongoose from "mongoose";
import {
  WEBSITE_ANALYSIS_RUN_LEGACY_TTL_SECONDS,
  WEBSITE_ANALYSIS_RUN_TTL_INDEX_NAME,
  WEBSITE_ANALYSIS_RUN_TTL_SECONDS,
} from "../src/lib/website-check/retention";

const apply = process.argv.includes("--apply");

async function main() {
  console.log(`Mode: ${apply ? "APPLY (mutating)" : "READ-ONLY inspection"}`);
  console.log("Collection: website_analysis_runs");

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is required.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const collection = mongoose.connection.collection("website_analysis_runs");
  const indexes = await collection.indexes();

  const ttlIndex = indexes.find(
    (idx) =>
      idx.key &&
      typeof idx.key === "object" &&
      "createdAt" in idx.key &&
      typeof idx.expireAfterSeconds === "number"
  );

  const ttlName = ttlIndex?.name ?? "none";
  const ttlSeconds = ttlIndex?.expireAfterSeconds ?? null;

  console.log("Current TTL index name:", ttlName);
  console.log("Current expireAfterSeconds:", ttlSeconds ?? "none");
  console.log("Target expireAfterSeconds:", WEBSITE_ANALYSIS_RUN_TTL_SECONDS, "(365 days)");
  console.log("Legacy value was:", WEBSITE_ANALYSIS_RUN_LEGACY_TTL_SECONDS, "(90 days)");
  console.log(
    "collMod supported:",
    "yes (MongoDB 4.2+; preferred over drop/create when changing TTL)"
  );
  console.log(
    "Migration necessary:",
    ttlSeconds === null
      ? "yes (create TTL index)"
      : ttlSeconds === WEBSITE_ANALYSIS_RUN_TTL_SECONDS
        ? "no"
        : "yes (update TTL via collMod or recreate index)"
  );

  if (!ttlIndex) {
    console.log("\nSuggested create (review first):");
    console.log(
      `db.website_analysis_runs.createIndex({ createdAt: 1 }, { expireAfterSeconds: ${WEBSITE_ANALYSIS_RUN_TTL_SECONDS}, name: "${WEBSITE_ANALYSIS_RUN_TTL_INDEX_NAME}" })`
    );
  } else if (ttlIndex.expireAfterSeconds === WEBSITE_ANALYSIS_RUN_TTL_SECONDS) {
    console.log("\nTTL index already matches 365 days. No migration needed.");
    await mongoose.disconnect();
    return;
  } else {
    console.log("\nSuggested collMod (preferred, MongoDB 4.2+):");
    console.log(
      JSON.stringify(
        {
          collMod: "website_analysis_runs",
          index: {
            keyPattern: { createdAt: 1 },
            expireAfterSeconds: WEBSITE_ANALYSIS_RUN_TTL_SECONDS,
          },
        },
        null,
        2
      )
    );
    console.log("\nFallback if collMod is unavailable:");
    console.log(`db.website_analysis_runs.dropIndex("${ttlIndex.name}")`);
    console.log(
      `db.website_analysis_runs.createIndex({ createdAt: 1 }, { expireAfterSeconds: ${WEBSITE_ANALYSIS_RUN_TTL_SECONDS} })`
    );
  }

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to attempt collMod on this connection.");
    await mongoose.disconnect();
    return;
  }

  if (ttlIndex && ttlIndex.expireAfterSeconds !== WEBSITE_ANALYSIS_RUN_TTL_SECONDS) {
    await mongoose.connection.db!.command({
      collMod: "website_analysis_runs",
      index: {
        keyPattern: { createdAt: 1 },
        expireAfterSeconds: WEBSITE_ANALYSIS_RUN_TTL_SECONDS,
      },
    });
    console.log("collMod applied.");
  }

  await mongoose.disconnect();
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error("Inspection failed:", message);
  process.exit(1);
});
