import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildLiveResultsViewModel } from "../../src/lib/website-check/results-view-model";
import { toPublicWebsiteAnalysisRunDto } from "../../src/lib/website-check/public-run-dto";
import { __testHelpers } from "../../src/lib/website-check/api/post-website-check-run";

describe("results cache banner", () => {
  it("shows cached replay banner with analysis date", () => {
    const vm = buildLiveResultsViewModel(
      toPublicWebsiteAnalysisRunDto(
        __testHelpers.sampleRun({
          status: "completed",
          phase: "done",
          analysisVersion: 2,
          completedAt: "2026-03-20T12:00:00.000Z",
          scores: { performance: 80, seo: 80, accessibility: 80, ux: 85, overall: 81 },
          aiInsights: { status: "completed", source: "fallback", recommendations: [] },
        }),
        { cacheHit: true }
      )
    );

    assert.ok(vm.cachedResultsBanner);
    assert.match(vm.cachedResultsBanner ?? "", /התוצאות מבוססות על בדיקה קודמת/);
    assert.doesNotMatch(vm.cachedResultsBanner ?? "", /מטמון|PageSpeed/);
  });
});
