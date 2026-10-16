import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getWebsiteAnalysisCacheIncompatibilityReason,
  isWebsiteAnalysisRunCacheCompatible,
  WEBSITE_CHECK_ANALYSIS_VERSION,
} from "../../src/lib/website-check/analysis-version";

describe("website analysis cache compatibility", () => {
  it("rejects legacy runs without analysisVersion", () => {
    assert.equal(
      getWebsiteAnalysisCacheIncompatibilityReason({ analysisVersion: undefined, aiInsights: undefined }),
      "missing_version"
    );
    assert.equal(isWebsiteAnalysisRunCacheCompatible({ analysisVersion: undefined }), false);
  });

  it("rejects version mismatch", () => {
    assert.equal(
      getWebsiteAnalysisCacheIncompatibilityReason({
        analysisVersion: 1,
        aiInsights: { status: "completed", recommendations: [] },
      }),
      "version_mismatch"
    );
  });

  it("accepts current version with terminal AI", () => {
    assert.equal(
      getWebsiteAnalysisCacheIncompatibilityReason({
        analysisVersion: WEBSITE_CHECK_ANALYSIS_VERSION,
        aiInsights: { status: "completed", source: "openai", recommendations: [] },
      }),
      null
    );
  });

  it("rejects AI still pending", () => {
    assert.equal(
      getWebsiteAnalysisCacheIncompatibilityReason({
        analysisVersion: WEBSITE_CHECK_ANALYSIS_VERSION,
        aiInsights: { status: "pending", recommendations: [] },
      }),
      "ai_not_finished"
    );
  });
});
