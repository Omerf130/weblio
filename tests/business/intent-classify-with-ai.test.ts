import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyIntentWithAi } from "../../src/lib/business/intents/classify-with-ai";
import type { IntentClassifier } from "../../src/lib/discovery/classifier/types";
import type { AdminIntentDetailDto } from "../../src/types/intent";

const intentId = "507f1f77bcf86cd799439011";

function mockIntent(
  overrides: Partial<AdminIntentDetailDto> = {}
): AdminIntentDetailDto {
  const now = new Date().toISOString();
  return {
    id: intentId,
    provider: "dev",
    content: "מחפש בונה אתר",
    contentPreview: "מחפש בונה אתר",
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

describe("classifyIntentWithAi", () => {
  it("returns not_found when intent does not exist", async () => {
    const result = await classifyIntentWithAi(
      intentId,
      { async classify() { return null; } },
      {
        getIntentById: async () => null,
        updateIntentClassification: async () => {
          throw new Error("must not update");
        },
      }
    );

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "not_found");
    }
  });

  it("returns not_unclassified when intent already has classification", async () => {
    let classifyCalls = 0;
    const fakeClassifier: IntentClassifier = {
      async classify() {
        classifyCalls += 1;
        return null;
      },
    };

    const result = await classifyIntentWithAi(
      intentId,
      fakeClassifier,
      {
        getIntentById: async () =>
          mockIntent({ classification: "explicitNeed" }),
        updateIntentClassification: async () => {
          throw new Error("must not update");
        },
      }
    );

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "not_unclassified");
    }
    assert.equal(classifyCalls, 0);
  });

  it("persists classification when classifier succeeds", async () => {
    const fakeClassifier: IntentClassifier = {
      async classify() {
        return {
          classification: "explicitNeed",
          reason: "בקשה ברורה",
          classifierVersion: "test-v1",
        };
      },
    };

    const result = await classifyIntentWithAi(
      intentId,
      fakeClassifier,
      {
        getIntentById: async () => mockIntent(),
        updateIntentClassification: async (input) =>
          mockIntent({
            classification: input.classification,
            classificationReason: input.classificationReason,
            classifierVersion: input.classifierVersion,
          }),
      }
    );

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.intent.classification, "explicitNeed");
      assert.equal(result.intent.classificationReason, "בקשה ברורה");
    }
  });

  it("returns classification_failed when classifier returns null", async () => {
    const result = await classifyIntentWithAi(
      intentId,
      { async classify() { return null; } },
      {
        getIntentById: async () => mockIntent(),
        updateIntentClassification: async () => {
          throw new Error("must not update");
        },
      }
    );

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "classification_failed");
    }
  });

  it("returns classification_failed when classifier throws", async () => {
    const result = await classifyIntentWithAi(
      intentId,
      {
        async classify() {
          throw new Error("boom");
        },
      },
      {
        getIntentById: async () => mockIntent(),
        updateIntentClassification: async () => {
          throw new Error("must not update");
        },
      }
    );

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "classification_failed");
    }
  });
});
