import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  WEBSITE_CHECK_BUSINESS_FINDINGS_LIMIT,
  buildOverallSummaryPresentation,
  buildVerifiedStrengths,
  selectPrioritizedBusinessFindings,
} from "../../src/lib/website-check/business-report";
import {
  buildDemoResultsViewModel,
  buildLiveResultsViewModel,
} from "../../src/lib/website-check/results-view-model";
import { toPublicWebsiteAnalysisRunDto } from "../../src/lib/website-check/public-run-dto";
import { __testHelpers } from "../../src/lib/website-check/api/post-website-check-run";
import type { WebsiteCheckFinding } from "../../src/views/website-check/website-check-results-content";

function finding(partial: Partial<WebsiteCheckFinding>): WebsiteCheckFinding {
  return {
    id: partial.id ?? "f",
    status: partial.status ?? "failed",
    title: partial.title ?? "T",
    summary: partial.summary ?? "S",
    details: partial.details ?? "D",
    ...partial,
  };
}

describe("results presentation (3G)", () => {
  it("caps verified business findings at three", () => {
    const many = Array.from({ length: 6 }, (_, i) =>
      finding({
        id: `f${i}`,
        auditId: "document-title",
        auditKind: "failure",
        status: "failed",
        category: "seo",
      })
    );
    const selected = selectPrioritizedBusinessFindings(many);
    assert.equal(WEBSITE_CHECK_BUSINESS_FINDINGS_LIMIT, 3);
    assert.equal(selected.length, 3);
  });

  it("builds headline from overall score deterministically", () => {
    const great = buildOverallSummaryPresentation(92, 0);
    assert.match(great.headline, /טוב מאוד/);
    const low = buildOverallSummaryPresentation(40, 2);
    assert.ok(low.headline.length > 0);
    assert.ok(low.support.length > 0);
  });

  it("builds verified strengths only from high measured scores", () => {
    const strengths = buildVerifiedStrengths({
      performance: 90,
      seo: 70,
      accessibility: 88,
      ux: null,
      overall: 82,
    });
    assert.equal(strengths.length, 2);
    assert.ok(strengths.every((s) => s.includes("בבדיקה")));
  });

  it("demo mode exposes no verified findings or strengths", () => {
    const vm = buildDemoResultsViewModel();
    assert.equal(vm.mode, "demo");
    assert.equal(vm.businessFindings.length, 0);
    assert.equal(vm.verifiedStrengths.length, 0);
  });

  it("live mode shows unavailable best-practices score honestly", () => {
    const vm = buildLiveResultsViewModel(
      toPublicWebsiteAnalysisRunDto(
        __testHelpers.sampleRun({
          status: "completed",
          phase: "done",
          scores: { performance: 80, seo: 80, accessibility: 80, ux: null, overall: 80 },
        })
      )
    );
    const ux = vm.metrics.find((m) => m.id === "ux");
    assert.equal(ux?.score, null);
    assert.equal(ux?.statusLabel, "לא זמין");
    assert.equal(ux?.label, "תקינות האתר");
    assert.ok(vm.businessFindings.length <= 3);
  });
});
