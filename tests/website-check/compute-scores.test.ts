import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeWebsiteAnalysisScores } from "../../src/lib/website-check/psi/compute-scores";

describe("computeWebsiteAnalysisScores", () => {
  it("maps lighthouse scores including best practices into ux slot", () => {
    const result = computeWebsiteAnalysisScores({
      lighthouse: {
        performance: 92,
        seo: 88,
        accessibility: 85,
        bestPractices: 90,
      },
      lighthouseVersion: "12.0.0",
    });

    assert.equal(result.scores.performance, 92);
    assert.equal(result.scores.seo, 88);
    assert.equal(result.scores.accessibility, 85);
    assert.equal(result.scores.ux, 90);
    assert.equal(result.scores.overall, 89);
    assert.deepEqual(result.scoreMeta.availableCategories, [
      "performance",
      "seo",
      "accessibility",
      "ux",
    ]);
  });

  it("renormalizes overall when some categories are missing", () => {
    const result = computeWebsiteAnalysisScores({
      lighthouse: {
        performance: 80,
        seo: null,
        accessibility: 60,
        bestPractices: null,
      },
    });

    assert.equal(result.scores.overall, 71);
    assert.deepEqual(result.scoreMeta.availableCategories, ["performance", "accessibility"]);
  });

  it("keeps overall null when no category scores exist", () => {
    const result = computeWebsiteAnalysisScores({
      lighthouse: {
        performance: null,
        seo: null,
        accessibility: null,
        bestPractices: null,
      },
    });
    assert.equal(result.scores.overall, null);
  });
});
