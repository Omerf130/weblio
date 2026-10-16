import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateWebsiteUrl } from "../../src/lib/website-check/validate-url";

describe("validateWebsiteUrl", () => {
  it("rejects empty input", () => {
    const result = validateWebsiteUrl("   ");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.message, /יש להזין/);
    }
  });

  it("normalizes bare domains to https", () => {
    const result = validateWebsiteUrl("example.com");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.normalized, "https://example.com/");
    }
  });

  it("accepts https URLs with path", () => {
    const result = validateWebsiteUrl("https://www.weblio.co.il/services");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.normalized, "https://www.weblio.co.il/services");
    }
  });

  it("accepts http URLs", () => {
    const result = validateWebsiteUrl("http://localhost:3000");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.normalized, "http://localhost:3000/");
    }
  });

  it("rejects non-http schemes", () => {
    const result = validateWebsiteUrl("ftp://example.com");
    assert.equal(result.ok, false);
  });

  it("rejects malformed URLs", () => {
    const result = validateWebsiteUrl("https://");
    assert.equal(result.ok, false);
  });
});
