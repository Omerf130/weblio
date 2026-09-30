import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildOpenAIIntentClassificationMessages,
  getOpenAIIntentSystemInstructions,
  INTENT_CLASSIFICATION_REGRESSION_FIXTURES,
} from "../../src/lib/discovery/classifier/openai-prompt";

describe("openai intent prompt v2", () => {
  it("includes buyer-vs-seller and conservative rules", () => {
    const system = getOpenAIIntentSystemInstructions();
    assert.match(system, /CUSTOMERS/i);
    assert.match(system, /BUYER \/ DEMAND/i);
    assert.match(system, /SELLER \/ SUPPLY/i);
    assert.match(system, /keywords alone are NOT evidence/i);
    assert.match(system, /prefer irrelevant/i);
    assert.match(system, /portfolios/i);
    assert.match(system, /אני בונה אתרים לעסקים, מוזמנים לפנות אליי/);
    assert.doesNotMatch(system, /prompt-v1/);
  });

  it("user message includes only intended classifier fields", () => {
    const { user } = buildOpenAIIntentClassificationMessages({
      title: "כותרת",
      content: "מחפש מישהו שיבנה לי אתר",
      sourcePlatform: "example.com",
      sourceType: "search_result",
    });

    assert.match(user, /Platform: example.com/);
    assert.match(user, /Source type: search_result/);
    assert.match(user, /Title: כותרת/);
    assert.match(user, /מחפש מישהו שיבנה לי אתר/);
    assert.doesNotMatch(user, /rawMetadata/i);
    assert.doesNotMatch(user, /Tavily/i);
    assert.doesNotMatch(user, /rank/i);
  });

  it("documents regression fixtures A–K with expected labels", () => {
    assert.equal(INTENT_CLASSIFICATION_REGRESSION_FIXTURES.length, 11);
    const byId = new Map(
      INTENT_CLASSIFICATION_REGRESSION_FIXTURES.map((fixture) => [fixture.id, fixture.expected])
    );
    assert.equal(byId.get("A"), "explicitNeed");
    assert.equal(byId.get("B"), "explicitNeed");
    assert.equal(byId.get("C"), "irrelevant");
    assert.equal(byId.get("D"), "irrelevant");
    assert.equal(byId.get("E"), "irrelevant");
    assert.equal(byId.get("F"), "irrelevant");
    assert.equal(byId.get("G"), "irrelevant");
    assert.equal(byId.get("H"), "irrelevant");
    assert.equal(byId.get("I"), "explicitNeed");
    assert.equal(byId.get("J"), "possibleNeed");
    assert.equal(byId.get("K"), "irrelevant");
  });
});
