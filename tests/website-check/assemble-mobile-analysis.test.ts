import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assembleMobilePageSpeedAnalysisFromPayload } from "../../src/lib/website-check/psi/assemble-mobile-analysis";
import {
  PSI_FIXTURE_COMPLETE,
  PSI_FIXTURE_MISSING_CATEGORIES,
  PSI_FIXTURE_NO_FIELD_DATA,
  PSI_FIXTURE_RUNTIME_ERROR,
} from "./psi-fixtures";

describe("assembleMobilePageSpeedAnalysisFromPayload", () => {
  it("assembles completed analysis from full fixture", () => {
    const result = assembleMobilePageSpeedAnalysisFromPayload(PSI_FIXTURE_COMPLETE);
    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.equal(result.status, "completed");
    assert.equal(result.scores.overall, 89);
    assert.equal(result.scores.ux, 90);
    assert.ok(result.findings.length > 0);
    assert.ok(result.recommendations.length > 0);
    assert.equal(result.findings[0]?.source, "lighthouse");
    assert.ok(result.findings.some((f) => f.auditId === "color-contrast"));
  });

  it("returns partial status when categories are missing", () => {
    const result = assembleMobilePageSpeedAnalysisFromPayload(PSI_FIXTURE_MISSING_CATEGORIES);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.status, "partial");
    assert.equal(result.scores.seo, null);
    assert.ok(result.missingCategories.includes("seo"));
  });

  it("keeps field data absent without fabricating values", () => {
    const result = assembleMobilePageSpeedAnalysisFromPayload(PSI_FIXTURE_NO_FIELD_DATA);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.fieldData.available, false);
  });

  it("fails on invalid payload", () => {
    const result = assembleMobilePageSpeedAnalysisFromPayload({ invalid: true });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error.code, "psi_invalid_response");
  });

  it("handles lighthouse runtime errors", () => {
    const result = assembleMobilePageSpeedAnalysisFromPayload(PSI_FIXTURE_RUNTIME_ERROR);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error.code, "psi_runtime_error");
  });
});
