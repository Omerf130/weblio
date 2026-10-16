import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isWebsiteCheckLiveAnalysisConfigured,
  parseWebsiteCheckEngineMode,
  resolvePageSpeedInsightsEnv,
} from "../../src/lib/website-check/pagespeed-env";

describe("pagespeed env", () => {
  it("defaults to demo engine", () => {
    assert.equal(parseWebsiteCheckEngineMode({}), "demo");
    assert.equal(parseWebsiteCheckEngineMode({ WEBSITE_CHECK_ENGINE: "demo" }), "demo");
  });

  it("does not resolve PSI key in demo mode", () => {
    const source = {
      WEBSITE_CHECK_ENGINE: "demo",
      PAGESPEED_INSIGHTS_API_KEY: "test-key",
    };
    assert.equal(resolvePageSpeedInsightsEnv(source), null);
    assert.equal(isWebsiteCheckLiveAnalysisConfigured(source), false);
  });

  it("resolves PSI key only when live engine and key are set", () => {
    const source = {
      WEBSITE_CHECK_ENGINE: "live",
      PAGESPEED_INSIGHTS_API_KEY: "  test-key  ",
    };
    const env = resolvePageSpeedInsightsEnv(source);
    assert.ok(env);
    assert.equal(env.apiKey, "test-key");
    assert.equal(env.timeoutMs, 125_000);
    assert.equal(isWebsiteCheckLiveAnalysisConfigured(source), true);
  });

  it("respects PAGESPEED_INSIGHTS_TIMEOUT_MS when valid", () => {
    const source = {
      WEBSITE_CHECK_ENGINE: "live",
      PAGESPEED_INSIGHTS_API_KEY: "test-key",
      PAGESPEED_INSIGHTS_TIMEOUT_MS: "90000",
    };
    const env = resolvePageSpeedInsightsEnv(source);
    assert.ok(env);
    assert.equal(env.timeoutMs, 90_000);
  });

  it("returns null when live engine is missing API key", () => {
    const source = { WEBSITE_CHECK_ENGINE: "live" };
    assert.equal(resolvePageSpeedInsightsEnv(source), null);
    assert.equal(isWebsiteCheckLiveAnalysisConfigured(source), false);
  });
});
