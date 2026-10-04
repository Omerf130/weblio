import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MAX_RAW_METADATA_BYTES } from "../../src/lib/discovery/raw-metadata";
import { safeParseIntentClassifierResult } from "../../src/lib/discovery/classifier/parse-result";
import {
  applyClassifierIfNeeded,
  ingestDiscoveredResult,
  ingestDiscoveredResults,
  shouldAttemptIntentClassification,
  MAX_DISCOVERY_INGEST_BATCH_SIZE,
} from "../../src/lib/discovery/ingest";
import { INGEST_ERROR_CODES, IngestError } from "../../src/lib/discovery/ingest-errors";
import { noopIntentClassifier } from "../../src/lib/discovery/classifier/noop-classifier";
import type { AdminIntentDetailDto } from "../../src/types/intent";
import type { IntentClassifier } from "../../src/lib/discovery/classifier/types";
import type { IngestPipelineDeps } from "../../src/lib/discovery/ingest";

const validInput = {
  provider: "dev",
  externalId: "ingest-test-1",
  content: "מישהו מכיר בונה אתרים?",
};

function mockIntent(
  overrides: Partial<AdminIntentDetailDto> = {}
): AdminIntentDetailDto {
  const now = new Date().toISOString();
  return {
    id: "507f1f77bcf86cd799439011",
    provider: "dev",
    externalId: "ingest-test-1",
    contentPreview: "preview",
    content: "מישהו מכיר בונה אתרים?",
    discoveredAt: now,
    lastSeenAt: now,
    discoveryCount: 1,
    classification: "unclassified",
    status: "new",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

const explicitTestClassifier: IntentClassifier = {
  async classify() {
    return {
      classification: "explicitNeed",
      reason: "test",
      classifierVersion: "test-v1",
    };
  },
};

function legacyIngestDeps(
  overrides: Partial<IngestPipelineDeps> = {}
): Partial<IngestPipelineDeps> {
  return {
    findDiscoveredIntentByDedupeKey: async () => null,
    touchDiscoveredIntentRediscovery: async () => ({
      intentId: mockIntent().id,
      created: false,
      dedupeKey: "provider:dev:ingest-test-1",
      intent: mockIntent({ classification: "explicitNeed" }),
    }),
    createClassifiedDiscoveredIntent: async () => ({
      intentId: mockIntent().id,
      created: true,
      dedupeKey: "provider:dev:ingest-test-1",
      intent: mockIntent({ classification: "explicitNeed" }),
    }),
    updateIntentClassification: async (input) =>
      mockIntent({ classification: input.classification }),
    ...overrides,
  };
}

describe("intent ingestion single result", () => {
  it("valid normalized result reaches upsert layer", async () => {
    let createCalled = false;
    const outcome = await ingestDiscoveredResult(validInput, {
      classifier: explicitTestClassifier,
      deps: legacyIngestDeps({
        createClassifiedDiscoveredIntent: async () => {
          createCalled = true;
          return {
            intentId: mockIntent().id,
            created: true,
            dedupeKey: "provider:dev:ingest-test-1",
            intent: mockIntent({ classification: "explicitNeed" }),
          };
        },
      }),
    });

    assert.equal(createCalled, true);
    assert.equal(outcome.ok, true);
    if (outcome.ok) {
      assert.equal(outcome.persisted, true);
      assert.equal(outcome.created, true);
      assert.equal(outcome.rediscovered, false);
    }
  });

  it("invalid result rejected safely", async () => {
    const outcome = await ingestDiscoveredResult({
      provider: "dev",
      content: "",
    });

    assert.equal(outcome.ok, false);
    if (!outcome.ok) {
      assert.equal(outcome.code, INGEST_ERROR_CODES.VALIDATION_FAILED);
    }
  });

  it("NoOp leaves classification unclassified", async () => {
    const outcome = await ingestDiscoveredResult(validInput, {
      classifier: noopIntentClassifier,
      deps: legacyIngestDeps(),
    });

    assert.equal(outcome.ok, true);
    if (outcome.ok) {
      assert.equal(outcome.persisted, false);
      assert.equal(outcome.classification, "unclassified");
      assert.equal(outcome.classified, false);
    }
  });

  it("enforces metadata boundary before upsert", async () => {
    const outcome = await ingestDiscoveredResult({
      ...validInput,
      rawMetadata: { payload: "x".repeat(MAX_RAW_METADATA_BYTES) },
    });

    assert.equal(outcome.ok, false);
    if (!outcome.ok) {
      assert.equal(outcome.code, INGEST_ERROR_CODES.VALIDATION_FAILED);
    }
  });
});

describe("intent ingestion batch", () => {
  it("processes multiple valid inputs", async () => {
    const summary = await ingestDiscoveredResults(
      [
        { provider: "dev", externalId: "b1", content: "אחד" },
        { provider: "dev", externalId: "b2", content: "שניים" },
      ],
      {
        classifier: explicitTestClassifier,
        deps: legacyIngestDeps(),
      }
    );

    assert.equal(summary.received, 2);
    assert.equal(summary.created, 2);
    assert.equal(summary.failed, 0);
  });

  it("invalid item does not fail entire batch", async () => {
    const summary = await ingestDiscoveredResults(
      [
        { provider: "dev", externalId: "ok", content: "תקין" },
        { provider: "dev", content: "" },
      ],
      {
        classifier: explicitTestClassifier,
        deps: legacyIngestDeps(),
      }
    );

    assert.equal(summary.received, 2);
    assert.equal(summary.created, 1);
    assert.equal(summary.failed, 1);
    assert.equal(summary.failures[0]?.index, 1);
    assert.equal(summary.failures[0]?.code, INGEST_ERROR_CODES.VALIDATION_FAILED);
  });

  it("rejects batches over max size", async () => {
    await assert.rejects(
      () =>
        ingestDiscoveredResults(new Array(MAX_DISCOVERY_INGEST_BATCH_SIZE + 1).fill(validInput)),
      (error) =>
        error instanceof IngestError &&
        error.code === INGEST_ERROR_CODES.BATCH_TOO_LARGE
    );
  });
});

describe("intent ingestion rediscovery semantics", () => {
  it("rediscovered ingest reports rediscovered without reclassifying", async () => {
    const outcome = await ingestDiscoveredResult(validInput, {
      deps: legacyIngestDeps({
        findDiscoveredIntentByDedupeKey: async () =>
          mockIntent({
            discoveryCount: 2,
            classification: "explicitNeed",
            classificationReason: "שמור",
          }),
      }),
    });

    assert.equal(outcome.ok, true);
    if (outcome.ok) {
      assert.equal(outcome.rediscovered, true);
      assert.equal(outcome.classification, "explicitNeed");
    }
  });
});

describe("intent classifier injection", () => {
  it("unclassified new result may receive classifier output", async () => {
    const fakeClassifier: IntentClassifier = {
      async classify() {
        return {
          classification: "explicitNeed",
          reason: "בקשה מפורשת",
          classifierVersion: "test-v1",
        };
      },
    };

    const outcome = await ingestDiscoveredResult(validInput, {
      classifier: fakeClassifier,
      deps: legacyIngestDeps(),
    });

    assert.equal(outcome.ok, true);
    if (outcome.ok) {
      assert.equal(outcome.classified, true);
      assert.equal(outcome.classification, "explicitNeed");
    }
  });

  it("existing meaningful classification skips classifier", async () => {
    let classifyCalls = 0;
    const fakeClassifier: IntentClassifier = {
      async classify() {
        classifyCalls += 1;
        return {
          classification: "irrelevant",
          reason: "לא היה צריך לרוץ",
          classifierVersion: "test-v1",
        };
      },
    };

    await applyClassifierIfNeeded(
      mockIntent({ classification: "possibleNeed" }),
      {
        provider: "dev",
        externalId: "x",
        content: "text",
      },
      fakeClassifier,
      {
        updateIntentClassification: async () => {
          throw new Error("must not update");
        },
      }
    );

    assert.equal(classifyCalls, 0);
  });

  it("throwing classifier leaves unclassified without failing ingest", async () => {
    const outcome = await ingestDiscoveredResult(validInput, {
      classifier: {
        async classify() {
          throw new Error("classifier exploded");
        },
      },
      deps: legacyIngestDeps(),
    });

    assert.equal(outcome.ok, true);
    if (outcome.ok) {
      assert.equal(outcome.persisted, false);
      assert.equal(outcome.classified, false);
      assert.equal(outcome.classification, "unclassified");
    }
  });

  it("null classifier result leaves unclassified", async () => {
    const state = await applyClassifierIfNeeded(
      mockIntent({ classification: "unclassified" }),
      { provider: "dev", externalId: "x", content: "text" },
      noopIntentClassifier,
      {
        updateIntentClassification: async () => {
          throw new Error("must not update");
        },
      }
    );

    assert.equal(state.classified, false);
    assert.equal(state.classification, "unclassified");
  });

  it("invalid classifier output cannot persist arbitrary classification", () => {
    const parsed = safeParseIntentClassifierResult({
      classification: "unclassified" as "explicitNeed",
      reason: "bad",
      classifierVersion: "x",
    });
    assert.equal(parsed.ok, false);
  });

  it("shouldAttemptIntentClassification is false for classified intents", () => {
    assert.equal(shouldAttemptIntentClassification("unclassified"), true);
    assert.equal(shouldAttemptIntentClassification("explicitNeed"), false);
    assert.equal(shouldAttemptIntentClassification("possibleNeed"), false);
    assert.equal(shouldAttemptIntentClassification("irrelevant"), false);
  });

  it("aggregated_social skips automatic OpenAI classification", async () => {
    let classifyCalls = 0;
    const mixedContent = [
      "Title: group | Facebook",
      "Image 1",
      "## Other posts",
      "### **מחפש שותף**",
      "React Native job",
      "Image 2",
    ].join("\n");

    const outcome = await ingestDiscoveredResult(
      {
        provider: "tavily",
        sourceUrl: "https://www.facebook.com/groups/1/posts/2",
        content: mixedContent,
      },
      {
        classifier: {
          async classify() {
            classifyCalls += 1;
            return {
              classification: "explicitNeed" as const,
              reason: "should not run",
              classifierVersion: "test-v1",
            };
          },
        },
        deps: legacyIngestDeps(),
      }
    );

    assert.equal(classifyCalls, 0);
    assert.equal(outcome.ok, true);
    if (outcome.ok) {
      assert.equal(outcome.persisted, false);
      assert.equal(outcome.classified, false);
      assert.equal(outcome.classification, "unclassified");
      assert.equal(outcome.skipReason, "auto_classification_skipped");
    }
  });

  it("normal Facebook content still uses classifier path", async () => {
    let classifyCalls = 0;
    const outcome = await ingestDiscoveredResult(
      {
        provider: "tavily",
        sourceUrl: "https://www.facebook.com/groups/1/posts/2",
        content: "היי, מחפש מישהו שיבנה לי אתר לעסק",
      },
      {
        classifier: {
          async classify() {
            classifyCalls += 1;
            return {
              classification: "explicitNeed" as const,
              reason: "בקשה",
              classifierVersion: "test-v1",
            };
          },
        },
        deps: legacyIngestDeps(),
      }
    );

    assert.equal(classifyCalls, 1);
    assert.equal(outcome.ok, true);
    if (outcome.ok) {
      assert.equal(outcome.classified, true);
    }
  });
});

describe("intent rediscovery preserved fields (upsert contract via mocks)", () => {
  it("dismissed status is returned unchanged from upsert layer", async () => {
    const existing = mockIntent({ status: "dismissed", classification: "irrelevant" });
    const outcome = await ingestDiscoveredResult(validInput, {
      deps: legacyIngestDeps({
        findDiscoveredIntentByDedupeKey: async () => existing,
        touchDiscoveredIntentRediscovery: async () => ({
          intentId: existing.id,
          created: false,
          dedupeKey: "provider:dev:ingest-test-1",
          intent: existing,
        }),
      }),
    });

    assert.equal(outcome.ok, true);
    if (outcome.ok) {
      assert.equal(outcome.rediscovered, true);
      assert.equal(outcome.classification, "irrelevant");
    }
  });

  it("saved status is returned unchanged from upsert layer", async () => {
    const outcome = await ingestDiscoveredResult(validInput, {
      deps: legacyIngestDeps({
        findDiscoveredIntentByDedupeKey: async () =>
          mockIntent({
            status: "saved",
            classification: "explicitNeed",
            opportunityId: "507f1f77bcf86cd799439012",
          }),
      }),
    });

    assert.equal(outcome.ok, true);
    if (outcome.ok) {
      assert.equal(outcome.classification, "explicitNeed");
      assert.equal(outcome.rediscovered, true);
    }
  });
});
