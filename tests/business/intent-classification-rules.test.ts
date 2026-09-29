import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  INTENT_CLASSIFICATION_LABELS,
  canIntentClassificationConvertToOpportunity,
} from "../../src/lib/business/intents/classification-rules";

describe("intent classification rules", () => {
  it("exposes Hebrew classification labels", () => {
    assert.equal(INTENT_CLASSIFICATION_LABELS.unclassified, "טרם סווג");
    assert.equal(INTENT_CLASSIFICATION_LABELS.explicitNeed, "צורך מפורש");
    assert.equal(INTENT_CLASSIFICATION_LABELS.possibleNeed, "צורך אפשרי");
    assert.equal(INTENT_CLASSIFICATION_LABELS.irrelevant, "לא רלוונטי");
  });

  it("allows explicitNeed conversion", () => {
    assert.equal(canIntentClassificationConvertToOpportunity("explicitNeed"), true);
  });

  it("allows possibleNeed conversion", () => {
    assert.equal(canIntentClassificationConvertToOpportunity("possibleNeed"), true);
  });

  it("blocks irrelevant conversion", () => {
    assert.equal(canIntentClassificationConvertToOpportunity("irrelevant"), false);
  });

  it("blocks unclassified conversion", () => {
    assert.equal(canIntentClassificationConvertToOpportunity("unclassified"), false);
  });
});
