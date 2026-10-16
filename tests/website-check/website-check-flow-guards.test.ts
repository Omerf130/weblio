import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { WEBSITE_CHECK_POLL_INTERVAL_MS } from "../../src/lib/website-check/useWebsiteCheckLivePoll";
import { WEBSITE_CHECK_INITIAL_STATE } from "../../src/lib/website-check/types";

describe("website-check client flow guards", () => {
  it("uses a 2 second polling interval", () => {
    assert.equal(WEBSITE_CHECK_POLL_INTERVAL_MS, 2_000);
  });

  it("initial state keeps run data null until submit", () => {
    assert.equal(WEBSITE_CHECK_INITIAL_STATE.phase, "entry");
    assert.equal(WEBSITE_CHECK_INITIAL_STATE.runId, null);
    assert.equal(WEBSITE_CHECK_INITIAL_STATE.analysisRun, null);
    assert.equal(WEBSITE_CHECK_INITIAL_STATE.flowMode, null);
  });
});
