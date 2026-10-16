import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDemoResultsViewModel,
  buildLiveResultsViewModel,
  buildWebsiteCheckResultsViewModel,
} from "../../src/lib/website-check/results-view-model";
import { toPublicWebsiteAnalysisRunDto } from "../../src/lib/website-check/public-run-dto";
import { __testHelpers } from "../../src/lib/website-check/api/post-website-check-run";
import {
  WEBSITE_CHECK_DEMO_OVERALL_SCORE,
  WEBSITE_CHECK_RESULTS_COPY,
} from "../../src/views/website-check/website-check-results-content";

describe("buildDemoResultsViewModel", () => {
  it("uses static demo scores and copy", () => {
    const vm = buildDemoResultsViewModel();
    assert.equal(vm.mode, "demo");
    assert.equal(vm.overallScore, WEBSITE_CHECK_DEMO_OVERALL_SCORE);
    assert.equal(vm.copy.demoBanner, WEBSITE_CHECK_RESULTS_COPY.demoBanner);
    assert.ok(vm.metrics.every((metric) => metric.score !== null));
    assert.equal(vm.metrics.find((m) => m.id === "ux")?.label, "תקינות האתר");
    assert.equal(vm.aiInsights, null);
    assert.equal(vm.businessFindings.length, 0);
  });
});

describe("buildLiveResultsViewModel", () => {
  it("maps API scores and best-practices metric label", () => {
    const vm = buildLiveResultsViewModel(
      toPublicWebsiteAnalysisRunDto(
        __testHelpers.sampleRun({
          status: "completed",
          phase: "done",
          scores: {
            performance: 91,
            seo: 88,
            accessibility: 79,
            ux: null,
            overall: 86,
          },
        })
      )
    );

    assert.equal(vm.mode, "live");
    assert.equal(vm.overallScore, 86);
    const ux = vm.metrics.find((m) => m.id === "ux");
    assert.equal(ux?.score, null);
    assert.equal(ux?.statusLabel, "לא זמין");
    assert.equal(ux?.label, "תקינות האתר");
    assert.ok(vm.aiInsights);
    assert.notEqual(vm.copy.demoBanner, WEBSITE_CHECK_RESULTS_COPY.demoBanner);
  });

  it("shows partial banner for partial status", () => {
    const vm = buildLiveResultsViewModel(
      toPublicWebsiteAnalysisRunDto(
        __testHelpers.sampleRun({ status: "partial", phase: "done", scores: { performance: 70, seo: null, accessibility: null, ux: null, overall: null } })
      )
    );
    assert.ok(vm.partialBanner);
    assert.equal(vm.overallScore, null);
    const perf = vm.metrics.find((m) => m.id === "performance");
    const seo = vm.metrics.find((m) => m.id === "seo");
    assert.equal(perf?.score, 70);
    assert.equal(seo?.score, null);
    assert.equal(seo?.statusLabel, "לא זמין");
  });

  it("maps findings and recommendations from run", () => {
    const vm = buildLiveResultsViewModel(
      toPublicWebsiteAnalysisRunDto(
        __testHelpers.sampleRun({
          status: "completed",
          phase: "done",
          findings: [
            {
              id: "f1",
              status: "failed",
              title: "Reduce unused JavaScript",
              summary: "Reduce unused JavaScript and defer loading scripts.",
              auditId: "unused-javascript",
              score: 0.2,
            },
          ],
          recommendations: [
            {
              id: "r1",
              priority: "high",
              title: "Properly size images",
              summary: "Serve images that are appropriately-sized.",
            },
          ],
        })
      )
    );
    assert.equal(vm.findings.length, 1);
    assert.equal(vm.findings[0].status, "failed");
    assert.equal(vm.findings[0].auditKind, "failure");
    assert.equal(vm.findings[0].auditId, "unused-javascript");
    assert.ok(vm.topFindings.length <= 3);
    assert.ok(vm.findingGroups.length >= 1);
    assert.equal(vm.recommendations.length, 1);
    assert.equal(vm.businessFindings.length, 1);
    assert.ok(vm.businessFindings[0].catalogMatched);
    assert.equal(vm.businessFindings[0].auditId, "unused-javascript");
  });

  it("handles empty findings and recommendations", () => {
    const vm = buildLiveResultsViewModel(
      toPublicWebsiteAnalysisRunDto(
        __testHelpers.sampleRun({ status: "completed", phase: "done", findings: [], recommendations: [] })
      )
    );
    assert.equal(vm.findings.length, 0);
    assert.equal(vm.recommendations.length, 0);
    assert.equal(vm.businessFindings.length, 0);
    assert.ok(vm.strengthsWeaknesses.emptyPositiveMessage);
  });
});

describe("buildWebsiteCheckResultsViewModel", () => {
  it("returns null for live without terminal run", () => {
    const vm = buildWebsiteCheckResultsViewModel(
      "live",
      toPublicWebsiteAnalysisRunDto(__testHelpers.sampleRun({ status: "running", phase: "psi_mobile" }))
    );
    assert.equal(vm, null);
  });

  it("returns null for live without run DTO", () => {
    assert.equal(buildWebsiteCheckResultsViewModel("live", null), null);
  });

  it("never mixes demo overall into live builder", () => {
    const vm = buildWebsiteCheckResultsViewModel(
      "live",
      toPublicWebsiteAnalysisRunDto(
        __testHelpers.sampleRun({
          status: "completed",
          phase: "done",
          scores: { performance: 55, seo: 60, accessibility: 50, ux: null, overall: 55 },
        })
      )
    );
    assert.ok(vm);
    assert.notEqual(vm.overallScore, WEBSITE_CHECK_DEMO_OVERALL_SCORE);
    assert.equal(vm.overallScore, 55);
  });
});
