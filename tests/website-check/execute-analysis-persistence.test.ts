import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { WEBSITE_CHECK_ANALYSIS_VERSION } from "../../src/lib/website-check/analysis-version";
import { buildWebsiteAnalysisRunPersistenceUpdate } from "../../src/lib/website-check/execute-analysis-persistence";
import {
  assembleMobilePageSpeedAnalysisFailure,
  assembleMobilePageSpeedAnalysisFromPayload,
} from "../../src/lib/website-check/psi/assemble-mobile-analysis";
import { pageSpeedFailure } from "../../src/lib/website-check/psi/pagespeed-errors";
import { PSI_FIXTURE_COMPLETE, PSI_FIXTURE_MISSING_CATEGORIES } from "./psi-fixtures";

describe("buildWebsiteAnalysisRunPersistenceUpdate", () => {
  it("persists completed analysis fields", () => {
    const analysis = assembleMobilePageSpeedAnalysisFromPayload(PSI_FIXTURE_COMPLETE);
    assert.equal(analysis.ok, true);
    if (!analysis.ok) return;

    const update = buildWebsiteAnalysisRunPersistenceUpdate(analysis);
    assert.equal(update.status, "completed");
    assert.equal(update.unsetActiveUrlHash, true);
    assert.equal(update.analysisVersion, WEBSITE_CHECK_ANALYSIS_VERSION);
    assert.ok(update.findings && update.findings.length > 0);
    assert.equal(update.scores?.ux, 90);
    assert.ok(update.scoreMeta?.missingLighthouseCategories === undefined);
  });

  it("persists partial analysis", () => {
    const analysis = assembleMobilePageSpeedAnalysisFromPayload(PSI_FIXTURE_MISSING_CATEGORIES);
    assert.equal(analysis.ok, true);
    if (!analysis.ok) return;
    assert.equal(analysis.status, "partial");

    const update = buildWebsiteAnalysisRunPersistenceUpdate(analysis);
    assert.equal(update.status, "partial");
    assert.equal(update.scores?.seo, null);
  });

  it("persists failed PSI errors", () => {
    const analysis = assembleMobilePageSpeedAnalysisFailure(pageSpeedFailure("psi_timeout"));
    const update = buildWebsiteAnalysisRunPersistenceUpdate(analysis);
    assert.equal(update.status, "failed");
    assert.equal(update.error?.code, "psi_timeout");
  });
});
