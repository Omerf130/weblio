import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hashWebsiteAnalysisUrl } from "../../src/lib/website-check/url-hash";

describe("hashWebsiteAnalysisUrl", () => {
  it("is deterministic for the same normalized URL", () => {
    const url = "https://example.com/";
    assert.equal(hashWebsiteAnalysisUrl(url), hashWebsiteAnalysisUrl(url));
  });

  it("differs when URL changes", () => {
    assert.notEqual(
      hashWebsiteAnalysisUrl("https://example.com/"),
      hashWebsiteAnalysisUrl("https://example.com/path")
    );
  });
});
