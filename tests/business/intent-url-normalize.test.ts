import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeDiscoveryUrl } from "../../src/lib/discovery/normalize-url";

describe("discovery URL normalization", () => {
  it("lowercases hostname", () => {
    const result = normalizeDiscoveryUrl("https://Example.COM/path");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.match(result.normalizedUrl, /^https:\/\/example\.com\//);
    }
  });

  it("removes URL fragment", () => {
    const result = normalizeDiscoveryUrl("https://example.com/page#section");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.normalizedUrl, "https://example.com/page");
    }
  });

  it("removes trailing slash on paths", () => {
    const result = normalizeDiscoveryUrl("https://example.com/foo/bar/");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.normalizedUrl, "https://example.com/foo/bar");
    }
  });

  it("removes utm tracking parameters", () => {
    const result = normalizeDiscoveryUrl(
      "https://example.com/p?utm_source=x&utm_medium=y&id=1"
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.doesNotMatch(result.normalizedUrl, /utm_/);
      assert.match(result.normalizedUrl, /id=1/);
    }
  });

  it("removes fbclid and gclid", () => {
    const result = normalizeDiscoveryUrl(
      "https://example.com/p?fbclid=abc&gclid=def&keep=1"
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.doesNotMatch(result.normalizedUrl, /fbclid/);
      assert.doesNotMatch(result.normalizedUrl, /gclid/);
      assert.match(result.normalizedUrl, /keep=1/);
    }
  });

  it("sorts query parameters deterministically", () => {
    const a = normalizeDiscoveryUrl("https://example.com/p?b=2&a=1");
    const b = normalizeDiscoveryUrl("https://example.com/p?a=1&b=2");
    assert.equal(a.ok, true);
    assert.equal(b.ok, true);
    if (a.ok && b.ok) {
      assert.equal(a.normalizedUrl, b.normalizedUrl);
    }
  });

  it("preserves meaningful unknown query params", () => {
    const result = normalizeDiscoveryUrl("https://example.com/item?articleId=42");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.match(result.normalizedUrl, /articleId=42/);
    }
  });

  it("rejects non-HTTPS URLs", () => {
    const result = normalizeDiscoveryUrl("http://example.com/x");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "not_https");
    }
  });

  it("rejects invalid URLs", () => {
    const result = normalizeDiscoveryUrl("not-a-url");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "invalid");
    }
  });
});
