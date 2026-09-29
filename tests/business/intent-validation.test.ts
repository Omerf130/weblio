import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MAX_RAW_METADATA_BYTES } from "../../src/lib/discovery/raw-metadata";
import {
  safeParseNormalizedDiscoveryInput,
  safeParseSetIntentStatus,
  safeParseUpdateIntentClassification,
} from "../../src/lib/validations/intent";

describe("intent normalized discovery validation", () => {
  const validMinimal = {
    provider: "dev",
    externalId: "sample-1",
    content: "מישהו מכיר בונה אתרים?",
  };

  it("accepts valid minimal normalized intent", () => {
    const result = safeParseNormalizedDiscoveryInput(validMinimal);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.provider, "dev");
      assert.equal(result.data.content, validMinimal.content);
    }
  });

  it("rejects missing content", () => {
    const result = safeParseNormalizedDiscoveryInput({
      provider: "dev",
      externalId: "x",
      content: "",
    });
    assert.equal(result.success, false);
  });

  it("rejects content too long", () => {
    const result = safeParseNormalizedDiscoveryInput({
      provider: "dev",
      externalId: "x",
      content: "a".repeat(10_001),
    });
    assert.equal(result.success, false);
  });

  it("rejects invalid URL", () => {
    const result = safeParseNormalizedDiscoveryInput({
      provider: "dev",
      sourceUrl: "not-a-url",
      content: "hello",
    });
    assert.equal(result.success, false);
  });

  it("rejects HTTP URL when HTTPS required", () => {
    const result = safeParseNormalizedDiscoveryInput({
      provider: "dev",
      sourceUrl: "http://example.com/post",
      content: "hello",
    });
    assert.equal(result.success, false);
  });

  it("accepts HTTPS sourceUrl without externalId", () => {
    const result = safeParseNormalizedDiscoveryInput({
      provider: "dev",
      sourceUrl: "https://example.com/post",
      content: "hello",
    });
    assert.equal(result.success, true);
  });

  it("rejects when both externalId and sourceUrl missing", () => {
    const result = safeParseNormalizedDiscoveryInput({
      provider: "dev",
      content: "hello",
    });
    assert.equal(result.success, false);
  });

  it("accepts rawMetadata within size limit", () => {
    const result = safeParseNormalizedDiscoveryInput({
      ...validMinimal,
      rawMetadata: { note: "ok", n: 1 },
    });
    assert.equal(result.success, true);
  });

  it("rejects oversized rawMetadata", () => {
    const big = "x".repeat(MAX_RAW_METADATA_BYTES);
    const result = safeParseNormalizedDiscoveryInput({
      ...validMinimal,
      rawMetadata: { payload: big },
    });
    assert.equal(result.success, false);
  });
});

describe("intent action validation object ids", () => {
  it("rejects invalid ObjectId for classification update", () => {
    const result = safeParseUpdateIntentClassification({
      intentId: "not-valid",
      classification: "explicitNeed",
    });
    assert.equal(result.success, false);
  });

  it("rejects invalid ObjectId for status update", () => {
    const result = safeParseSetIntentStatus({
      intentId: "123",
      status: "dismissed",
    });
    assert.equal(result.success, false);
  });

  it("accepts valid ObjectId for status update", () => {
    const result = safeParseSetIntentStatus({
      intentId: "507f1f77bcf86cd799439011",
      status: "dismissed",
    });
    assert.equal(result.success, true);
  });
});
