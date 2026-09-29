import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeDedupeKey,
  DedupeKeyInputError,
} from "../../src/lib/discovery/dedupe-key";

describe("intent dedupe key", () => {
  it("uses provider + externalId when present", () => {
    const key = computeDedupeKey({
      provider: "dev",
      externalId: "post-123",
    });
    assert.equal(key, "provider:dev:post-123");
  });

  it("normalizes provider casing", () => {
    const key = computeDedupeKey({
      provider: "  DEV  ",
      externalId: "x",
    });
    assert.equal(key, "provider:dev:x");
  });

  it("prefers externalId over sourceUrl when both provided", () => {
    const key = computeDedupeKey({
      provider: "dev",
      externalId: "id-1",
      sourceUrl: "https://example.com/other",
    });
    assert.equal(key, "provider:dev:id-1");
  });

  it("uses URL hash fallback deterministically", () => {
    const url = "https://Example.com/page?utm_source=spam";
    const a = computeDedupeKey({ provider: "dev", sourceUrl: url });
    const b = computeDedupeKey({ provider: "dev", sourceUrl: url.toLowerCase() });
    assert.equal(a, b);
    assert.match(a, /^url:[a-f0-9]{64}$/);
  });

  it("produces same key for equivalent normalized URLs", () => {
    const a = computeDedupeKey({
      provider: "dev",
      sourceUrl: "https://example.com/foo/?utm_campaign=x",
    });
    const b = computeDedupeKey({
      provider: "dev",
      sourceUrl: "https://example.com/foo",
    });
    assert.equal(a, b);
  });

  it("produces different keys for different meaningful URLs", () => {
    const a = computeDedupeKey({
      provider: "dev",
      sourceUrl: "https://example.com/a",
    });
    const b = computeDedupeKey({
      provider: "dev",
      sourceUrl: "https://example.com/b",
    });
    assert.notEqual(a, b);
  });

  it("rejects missing externalId and sourceUrl", () => {
    assert.throws(
      () => computeDedupeKey({ provider: "dev" }),
      (error) =>
        error instanceof DedupeKeyInputError &&
        error.message === "EXTERNAL_ID_OR_SOURCE_URL_REQUIRED"
    );
  });
});
