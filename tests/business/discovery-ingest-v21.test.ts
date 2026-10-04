import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { noopIntentClassifier } from "../../src/lib/discovery/classifier/noop-classifier";
import type { IntentClassifier } from "../../src/lib/discovery/classifier/types";
import {
  ingestDiscoveredResult,
  type IngestPipelineDeps,
} from "../../src/lib/discovery/ingest";
import type { AdminIntentDetailDto } from "../../src/types/intent";

const validInput = {
  provider: "tavily",
  sourceUrl: "https://example.co.il/post/new-1",
  content: "מחפש מישהו שיבנה לי אתר לעסק קטן באזור המרכז",
  title: "מחפש בונה אתרים",
};

function mockIntent(
  overrides: Partial<AdminIntentDetailDto> = {}
): AdminIntentDetailDto {
  const now = new Date().toISOString();
  return {
    id: "507f1f77bcf86cd799439011",
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

const explicitClassifier: IntentClassifier = {
  async classify() {
    return {
      classification: "explicitNeed",
      reason: "בקשה מפורשת",
      classifierVersion: "test-v1",
    };
  },
};

function baseDeps(overrides: Partial<IngestPipelineDeps> = {}): Partial<IngestPipelineDeps> {
  return {
    findDiscoveredIntentByDedupeKey: async () => null,
    touchDiscoveredIntentRediscovery: async () => ({
      intentId: mockIntent().id,
      created: false,
      dedupeKey: "url:existing",
      intent: mockIntent({ classification: "explicitNeed" }),
    }),
    createClassifiedDiscoveredIntent: async () => ({
      intentId: mockIntent().id,
      created: true,
      dedupeKey: "url:new",
      intent: mockIntent({ classification: "explicitNeed" }),
    }),
    updateIntentClassification: async (input) =>
      mockIntent({ classification: input.classification }),
    ...overrides,
  };
}

describe("discovery ingest v2.1 persistence", () => {
  it("persists explicitNeed new candidate", async () => {
    let created = false;
    const outcome = await ingestDiscoveredResult(validInput, {
      classifier: explicitClassifier,
      deps: baseDeps({
        createClassifiedDiscoveredIntent: async () => {
          created = true;
          return {
            intentId: mockIntent().id,
            created: true,
            dedupeKey: "url:new",
            intent: mockIntent({ classification: "explicitNeed" }),
          };
        },
      }),
    });

    assert.equal(created, true);
    assert.equal(outcome.ok, true);
    if (outcome.ok) {
      assert.equal(outcome.persisted, true);
      assert.equal(outcome.created, true);
      assert.equal(outcome.classification, "explicitNeed");
    }
  });

  it("persists possibleNeed new candidate", async () => {
    const outcome = await ingestDiscoveredResult(validInput, {
      classifier: {
        async classify() {
          return {
            classification: "possibleNeed",
            reason: "maybe",
            classifierVersion: "test-v1",
          };
        },
      },
      deps: baseDeps({
        createClassifiedDiscoveredIntent: async () => ({
          intentId: mockIntent().id,
          created: true,
          dedupeKey: "url:new",
          intent: mockIntent({ classification: "possibleNeed" }),
        }),
      }),
    });

    assert.equal(outcome.ok, true);
    if (outcome.ok) {
      assert.equal(outcome.persisted, true);
      assert.equal(outcome.classification, "possibleNeed");
    }
  });

  it("does not persist irrelevant new candidate", async () => {
    let created = false;
    const outcome = await ingestDiscoveredResult(validInput, {
      classifier: {
        async classify() {
          return {
            classification: "irrelevant",
            reason: "noise",
            classifierVersion: "test-v1",
          };
        },
      },
      deps: baseDeps({
        createClassifiedDiscoveredIntent: async () => {
          created = true;
          throw new Error("must not create");
        },
      }),
    });

    assert.equal(created, false);
    assert.equal(outcome.ok, true);
    if (outcome.ok) {
      assert.equal(outcome.persisted, false);
      assert.equal(outcome.skipReason, "not_actionable");
      assert.equal(outcome.classification, "irrelevant");
    }
  });

  it("does not persist deferred candidate when classification cap exhausted", async () => {
    const outcome = await ingestDiscoveredResult(validInput, {
      classifier: explicitClassifier,
      attemptClassification: false,
      deps: baseDeps(),
    });

    assert.equal(outcome.ok, true);
    if (outcome.ok) {
      assert.equal(outcome.persisted, false);
      assert.equal(outcome.skipReason, "classification_deferred");
    }
  });

  it("does not create new Intent when classifier fails", async () => {
    let created = false;
    const outcome = await ingestDiscoveredResult(validInput, {
      classifier: {
        async classify() {
          throw new Error("boom");
        },
      },
      deps: baseDeps({
        createClassifiedDiscoveredIntent: async () => {
          created = true;
          throw new Error("must not create");
        },
      }),
    });

    assert.equal(created, false);
    assert.equal(outcome.ok, true);
    if (outcome.ok) {
      assert.equal(outcome.persisted, false);
      assert.equal(outcome.skipReason, "classification_failed");
    }
  });

  it("rediscovery updates existing Intent without re-classifying", async () => {
    let touchCalled = false;
    const outcome = await ingestDiscoveredResult(validInput, {
      classifier: {
        async classify() {
          throw new Error("must not classify existing");
        },
      },
      deps: baseDeps({
        findDiscoveredIntentByDedupeKey: async () =>
          mockIntent({ classification: "unclassified", discoveryCount: 2 }),
        touchDiscoveredIntentRediscovery: async () => {
          touchCalled = true;
          return {
            intentId: mockIntent().id,
            created: false,
            dedupeKey: "url:existing",
            intent: mockIntent({ classification: "unclassified", discoveryCount: 3 }),
          };
        },
      }),
    });

    assert.equal(touchCalled, true);
    assert.equal(outcome.ok, true);
    if (outcome.ok) {
      assert.equal(outcome.persisted, true);
      assert.equal(outcome.rediscovered, true);
      assert.equal(outcome.classification, "unclassified");
    }
  });

  it("noop classifier does not persist new URL", async () => {
    const outcome = await ingestDiscoveredResult(validInput, {
      classifier: noopIntentClassifier,
      deps: baseDeps(),
    });

    assert.equal(outcome.ok, true);
    if (outcome.ok) {
      assert.equal(outcome.persisted, false);
      assert.equal(outcome.skipReason, "classification_failed");
    }
  });
});
