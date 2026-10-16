import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  handleGetWebsiteCheckRun,
} from "../../src/lib/website-check/api/get-website-check-run";
import { __testHelpers } from "../../src/lib/website-check/api/post-website-check-run";

describe("handleGetWebsiteCheckRun", () => {
  it("returns 404 for invalid id format", async () => {
    const result = await handleGetWebsiteCheckRun("not-an-object-id", {
      expireStaleWebsiteAnalysisRuns: async () => 0,
      getWebsiteAnalysisRunById: async () => null,
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.status, 404);
  });

  it("returns a safe public DTO", async () => {
    const run = __testHelpers.sampleRun({
      status: "completed",
      phase: "done",
      scores: { performance: 80, seo: 80, accessibility: 80, ux: null, overall: 80 },
    });

    const result = await handleGetWebsiteCheckRun(run.id, {
      expireStaleWebsiteAnalysisRuns: async () => 0,
      getWebsiteAnalysisRunById: async () => run,
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.run.status, "completed");
    assert.equal("urlHash" in result.run, false);
  });
});
