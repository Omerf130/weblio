import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractPrimaryDocumentationUrl,
  parseLighthouseTextSegments,
  stripMarkdownLinksForSummary,
} from "../../src/lib/website-check/lighthouse-text";

describe("lighthouse-text", () => {
  it("extracts markdown documentation URLs", () => {
    const url = extractPrimaryDocumentationUrl(
      "Learn more about [LCP](https://web.dev/lcp/) and metrics."
    );
    assert.equal(url, "https://web.dev/lcp/");
  });

  it("strips markdown links from summaries", () => {
    const summary = stripMarkdownLinksForSummary(
      "See [Optimize LCP](https://web.dev/lcp/) for details."
    );
    assert.match(summary, /Optimize LCP/);
    assert.doesNotMatch(summary, /https:\/\//);
  });

  it("parses inline markdown links into segments", () => {
    const segments = parseLighthouseTextSegments("Read [docs](https://example.com/docs) now.");
    assert.equal(segments.length, 3);
    assert.equal(segments[1].type, "link");
    if (segments[1].type === "link") {
      assert.equal(segments[1].href, "https://example.com/docs");
    }
  });
});
