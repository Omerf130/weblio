import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { containsWebsiteCheckLongDash } from "../../src/lib/website-check/normalize-public-copy";
import { WEBSITE_CHECK_COPY } from "../../src/views/website-check/website-check-content";
import {
  WEBSITE_CHECK_DEMO_FINDINGS,
  WEBSITE_CHECK_DEMO_METRICS,
  WEBSITE_CHECK_DEMO_RECOMMENDATIONS,
  WEBSITE_CHECK_LIVE_RESULTS_META,
} from "../../src/views/website-check/website-check-results-content";

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    out.push(value);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
    return out;
  }
  if (value && typeof value === "object") {
    for (const entry of Object.values(value)) collectStrings(entry, out);
  }
  return out;
}

describe("Website Analyzer public copy punctuation", () => {
  it("static user-facing strings avoid en/em dashes", () => {
    const bundles = [
      WEBSITE_CHECK_COPY,
      WEBSITE_CHECK_DEMO_METRICS,
      WEBSITE_CHECK_DEMO_FINDINGS,
      WEBSITE_CHECK_DEMO_RECOMMENDATIONS,
      WEBSITE_CHECK_LIVE_RESULTS_META,
    ];

    for (const bundle of bundles) {
      for (const text of collectStrings(bundle)) {
        assert.equal(
          containsWebsiteCheckLongDash(text),
          false,
          `long dash in: ${text.slice(0, 80)}`
        );
      }
    }
  });
});
