import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { noopIntentClassifier } from "../../src/lib/discovery/classifier/noop-classifier";

describe("noop intent classifier", () => {
  it("returns null and does not classify", async () => {
    const result = await noopIntentClassifier.classify({
      content: "מישהו מכיר בונה אתרים?",
    });
    assert.equal(result, null);
  });
});
