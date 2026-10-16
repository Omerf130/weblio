import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parsePageSpeedResponsePayload } from "../../src/lib/website-check/psi/parse-pagespeed-response";
import {
  PSI_FIXTURE_COMPLETE,
  PSI_FIXTURE_MISSING_CATEGORIES,
  PSI_FIXTURE_NO_FIELD_DATA,
} from "./psi-fixtures";

describe("parsePageSpeedResponsePayload", () => {
  it("parses complete PSI fixture with lab and field data", () => {
    const parsed = parsePageSpeedResponsePayload(PSI_FIXTURE_COMPLETE);
    assert.ok(parsed);
    assert.equal(parsed.categoryScores.performance, 92);
    assert.equal(parsed.categoryScores.seo, 88);
    assert.equal(parsed.categoryScores.accessibility, 85);
    assert.equal(parsed.categoryScores.bestPractices, 90);
    assert.equal(parsed.missingCategories.length, 0);
    assert.equal(parsed.fieldData.available, true);
    assert.ok(parsed.fieldData.metrics?.some((m) => m.id === "LARGEST_CONTENTFUL_PAINT_MS"));
    assert.ok(parsed.labMetrics.metrics.some((m) => m.id === "largest-contentful-paint"));
  });

  it("reports missing categories", () => {
    const parsed = parsePageSpeedResponsePayload(PSI_FIXTURE_MISSING_CATEGORIES);
    assert.ok(parsed);
    assert.equal(parsed.categoryScores.performance, 70);
    assert.equal(parsed.categoryScores.seo, null);
    assert.deepEqual(parsed.missingCategories.sort(), [
      "accessibility",
      "best-practices",
      "seo",
    ]);
  });

  it("handles missing field data", () => {
    const parsed = parsePageSpeedResponsePayload(PSI_FIXTURE_NO_FIELD_DATA);
    assert.ok(parsed);
    assert.equal(parsed.fieldData.available, false);
    assert.equal(parsed.fieldData.metrics, undefined);
  });

  it("returns null for invalid payload", () => {
    assert.equal(parsePageSpeedResponsePayload(null), null);
    assert.equal(parsePageSpeedResponsePayload({}), null);
    assert.equal(parsePageSpeedResponsePayload({ lighthouseResult: null }), null);
  });
});
