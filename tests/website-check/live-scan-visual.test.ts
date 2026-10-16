import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getLiveScanVisualState,
  isTerminalAnalysisStatus,
  liveActiveStageIndexForRun,
} from "../../src/lib/website-check/live-scan-visual";
import { toPublicWebsiteAnalysisRunDto } from "../../src/lib/website-check/public-run-dto";
import { __testHelpers } from "../../src/lib/website-check/api/post-website-check-run";

function publicRun(overrides: Parameters<typeof __testHelpers.sampleRun>[0] = {}) {
  return toPublicWebsiteAnalysisRunDto(__testHelpers.sampleRun(overrides));
}

describe("isTerminalAnalysisStatus", () => {
  it("treats completed, partial and failed as terminal", () => {
    assert.equal(isTerminalAnalysisStatus("completed"), true);
    assert.equal(isTerminalAnalysisStatus("partial"), true);
    assert.equal(isTerminalAnalysisStatus("failed"), true);
    assert.equal(isTerminalAnalysisStatus("running"), false);
    assert.equal(isTerminalAnalysisStatus("queued"), false);
  });
});

describe("getLiveScanVisualState", () => {
  it("uses indeterminate progress while running", () => {
    const visual = getLiveScanVisualState(
      publicRun({ status: "running", phase: "psi_mobile" })
    );
    assert.equal(visual.indeterminateProgress, true);
    assert.equal(visual.isComplete, false);
    assert.equal(visual.isFailed, false);
    assert.match(visual.statusLabel, /PageSpeed/i);
  });

  it("highlights only one stage while running without marking others completed", () => {
    const run = publicRun({ status: "running", phase: "psi_mobile" });
    assert.equal(liveActiveStageIndexForRun(run), 0);
    const visual = getLiveScanVisualState(run);
    assert.deepEqual(visual.stageStatuses, ["active", "pending", "pending", "pending"]);
  });

  it("uses cache replay copy when cacheHit is set", () => {
    const visual = getLiveScanVisualState(
      toPublicWebsiteAnalysisRunDto(
        __testHelpers.sampleRun({
          status: "completed",
          phase: "done",
          completedAt: "2026-03-20T10:00:00.000Z",
        }),
        { cacheHit: true }
      )
    );
    assert.match(visual.statusLabel, /בדיקה קודמת/);
    assert.match(visual.activityLine, /התוצאות מבוססות על בדיקה קודמת/);
  });

  it("marks complete for completed status without fake percent UI need", () => {
    const visual = getLiveScanVisualState(
      publicRun({ status: "completed", phase: "done", scores: { performance: 90, seo: 88, accessibility: 95, ux: null, overall: 91 } })
    );
    assert.equal(visual.isComplete, true);
    assert.equal(visual.indeterminateProgress, false);
    assert.equal(visual.timelineBeamProgress, 100);
  });

  it("marks partial as complete with partial label", () => {
    const visual = getLiveScanVisualState(
      publicRun({ status: "partial", phase: "done" })
    );
    assert.equal(visual.isComplete, true);
    assert.match(visual.statusLabel, /חלקית/);
  });

  it("surfaces failed state and error copy", () => {
    const messagePublic = "הניתוח נכשל בגלל timeout.";
    const visual = getLiveScanVisualState(
      publicRun({
        status: "failed",
        phase: "done",
        error: { code: "psi_timeout", messagePublic },
      })
    );
    assert.equal(visual.isFailed, true);
    assert.equal(visual.statusLabel, "הניתוח נכשל");
    assert.equal(visual.activityLine, messagePublic);
  });

  it("returns safe defaults when run is null", () => {
    const visual = getLiveScanVisualState(null);
    assert.equal(visual.indeterminateProgress, true);
    assert.equal(visual.timelineBeamProgress, 0);
  });
});
