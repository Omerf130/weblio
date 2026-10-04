import assert from "node:assert/strict";
import { describe, it } from "node:test";
import mongoose from "mongoose";
import { buildOverviewActionableIntentQuery } from "../../src/lib/business/intents/overview-actionable-intent-query";
import {
  assertRediscoveryUpdateDoesNotResetPreservedFields,
  buildRediscoveryUpdate,
  REDISCOVERY_PRESERVED_FIELD_KEYS,
} from "../../src/lib/data/intent-rediscovery";
import { DISCOVERY_INGEST_PATH_CLASSIFIED_FIRST } from "../../src/lib/discovery/discovery-ingest-path";
import { ingestDiscoveredResult } from "../../src/lib/discovery/ingest";
import type { AdminIntentDetailDto } from "../../src/types/intent";

const validInput = {
  provider: "tavily",
  sourceUrl: "https://example.co.il/post/provenance-1",
  content: "מחפש מישהו שיבנה לי אתר לעסק קטן",
  title: "מחפש בונה אתרים",
  rawMetadata: { profileId: "X02", query: "test query" },
};

const runId = new mongoose.Types.ObjectId().toString();

function mockIntent(
  overrides: Partial<AdminIntentDetailDto> = {}
): AdminIntentDetailDto {
  const now = new Date().toISOString();
  return {
    id: new mongoose.Types.ObjectId().toString(),
    provider: "tavily",
    contentPreview: "preview",
    content: validInput.content,
    discoveredAt: now,
    lastSeenAt: now,
    discoveryCount: 1,
    classification: "explicitNeed",
    status: "new",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("Intent discovery creation provenance", () => {
  it("passes discoveryRunId into classified-first create", async () => {
    let capturedRunId: string | undefined;
    const outcome = await ingestDiscoveredResult(validInput, {
      classifier: {
        async classify() {
          return {
            classification: "explicitNeed",
            reason: "test",
            classifierVersion: "test-v1",
          };
        },
      },
      discoveryRunId: runId,
      deps: {
        findDiscoveredIntentByDedupeKey: async () => null,
        touchDiscoveredIntentRediscovery: async () => ({
          intentId: mockIntent().id,
          created: false,
          dedupeKey: "url:x",
          intent: mockIntent(),
        }),
        updateIntentClassification: async (input) =>
          mockIntent({ classification: input.classification }),
        createClassifiedDiscoveredIntent: async (input) => {
          capturedRunId = input.discoveryCreatedRunId;
          return {
            intentId: mockIntent().id,
            created: true,
            dedupeKey: "url:x",
            intent: mockIntent(),
          };
        },
      },
    });

    assert.equal(outcome.ok, true);
    assert.equal(capturedRunId, runId);
  });

  it("rediscovery update must not touch provenance fields", () => {
    assert.ok(REDISCOVERY_PRESERVED_FIELD_KEYS.includes("discoveryCreatedRunId"));
    assert.ok(REDISCOVERY_PRESERVED_FIELD_KEYS.includes("discoveryIngestPath"));
    const update = buildRediscoveryUpdate(new Date());
    assertRediscoveryUpdateDoesNotResetPreservedFields(update);
    assert.throws(() =>
      assertRediscoveryUpdateDoesNotResetPreservedFields({
        $set: { lastSeenAt: new Date(), discoveryIngestPath: "classified_first" },
        $inc: { discoveryCount: 1 },
      })
    );
  });
});

describe("Business Overview actionable intent query", () => {
  it("requires classified_first ingest path", () => {
    const query = buildOverviewActionableIntentQuery();
    assert.equal(query.status, "new");
    assert.deepEqual(query.classification, {
      $in: ["explicitNeed", "possibleNeed"],
    });
    assert.equal(query.discoveryIngestPath, DISCOVERY_INGEST_PATH_CLASSIFIED_FIRST);
    assert.equal("$expr" in query, false);
  });

  it("count and list helpers share overview query module", async () => {
    const { readFileSync } = await import("node:fs");
    const { join, dirname } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const intentsSource = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../src/lib/data/intents.ts"),
      "utf8"
    );
    assert.match(intentsSource, /countClassifiedReviewIntents[\s\S]*buildOverviewActionableIntentQuery/);
    assert.match(intentsSource, /listRecentClassifiedReviewIntents[\s\S]*buildOverviewActionableIntentQuery/);
  });
});

describe("legacy intents without provenance", () => {
  it("overview query excludes documents missing discoveryIngestPath", () => {
    const query = buildOverviewActionableIntentQuery();
    assert.equal(query.discoveryIngestPath, "classified_first");
  });
});
