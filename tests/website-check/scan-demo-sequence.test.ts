import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getScanDemoVisualState,
  SCAN_DEMO_STAGE_COUNT,
  SCAN_DEMO_STAGES,
} from "../../src/lib/website-check/scan-demo-sequence";

describe("getScanDemoVisualState", () => {
  it("starts with first stage active at 0%", () => {
    const state = getScanDemoVisualState(0, 0);
    assert.equal(state.activeStageIndex, 0);
    assert.equal(state.isComplete, false);
    assert.equal(state.stageStatuses[0], "active");
    assert.equal(state.stageStatuses[1], "pending");
  });

  it("marks stages completed as progress advances", () => {
    const midSecond = getScanDemoVisualState(30, 0);
    assert.equal(midSecond.activeStageIndex, 1);
    assert.equal(midSecond.stageStatuses[0], "completed");
    assert.equal(midSecond.stageStatuses[1], "active");

    const midThird = getScanDemoVisualState(55, 0);
    assert.equal(midThird.stageStatuses[1], "completed");
    assert.equal(midThird.stageStatuses[2], "active");
  });

  it("completes all stages at 100%", () => {
    const state = getScanDemoVisualState(100, 0);
    assert.equal(state.isComplete, true);
    assert.equal(state.stageStatuses.filter((s) => s === "completed").length, SCAN_DEMO_STAGE_COUNT);
    assert.match(state.statusLabel, /לא זמין/);
  });

  it("cycles activity lines deterministically", () => {
    const stage = SCAN_DEMO_STAGES[0];
    const first = getScanDemoVisualState(5, 0).activityLine;
    const second = getScanDemoVisualState(5, 1).activityLine;
    assert.notEqual(first, second);
    assert.equal(getScanDemoVisualState(5, stage.activities.length).activityLine, first);
  });
});
