import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  __testHelpers,
  handlePostWebsiteCheckRun,
} from "../../src/lib/website-check/api/post-website-check-run";
import { WebsiteCheckRateLimitError } from "../../src/lib/website-check/rate-limit";
import { assembleMobilePageSpeedAnalysisFromPayload } from "../../src/lib/website-check/psi/assemble-mobile-analysis";
import { PSI_FIXTURE_COMPLETE } from "./psi-fixtures";

const liveEnv = {
  WEBSITE_CHECK_ENGINE: "live",
  PAGESPEED_INSIGHTS_API_KEY: "test-key",
};

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request("https://weblio.co.il/api/website-check/runs", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  });
}

describe("handlePostWebsiteCheckRun", () => {
  it("returns 503 when live engine is not configured", async () => {
    const result = await handlePostWebsiteCheckRun({
      request: makeRequest(),
      body: { url: "https://example.com" },
      envSource: { WEBSITE_CHECK_ENGINE: "demo" },
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.status, 503);
  });

  it("rejects localhost URLs", async () => {
    const result = await handlePostWebsiteCheckRun({
      request: makeRequest(),
      body: { url: "http://localhost:3000" },
      envSource: liveEnv,
      deps: {
        consumeWebsiteCheckRateLimit: async () => undefined,
        expireStaleWebsiteAnalysisRuns: async () => 0,
      },
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.status, 400);
  });

  it("returns cached completed run without scheduling execution", async () => {
    const cached = __testHelpers.sampleRun({
      status: "completed",
      phase: "done",
      analysisVersion: 2,
      scores: {
        performance: 90,
        seo: 90,
        accessibility: 90,
        ux: 92,
        overall: 91,
      },
      aiInsights: {
        status: "completed",
        source: "openai",
        recommendations: [],
        positiveSummary: null,
      },
    });

    let executed = false;

    const result = await handlePostWebsiteCheckRun({
      request: makeRequest(),
      body: { url: "https://example.com" },
      envSource: liveEnv,
      scheduleAfter: (task) => {
        void task();
        executed = true;
      },
      deps: {
        consumeWebsiteCheckRateLimit: async () => undefined,
        expireStaleWebsiteAnalysisRuns: async () => 0,
        findCachedWebsiteAnalysisByUrl: async () => cached,
        findActiveWebsiteAnalysisRunByUrlHash: async () => null,
        executeWebsiteAnalysisRun: async () => {
          executed = true;
        },
      },
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.status, 200);
    assert.equal(result.run.cacheHit, true);
    assert.equal(executed, false);
    assert.equal(result.run.url, "https://example.com/");
    assert.equal("urlHash" in result.run, false);
    assert.equal(result.run.analysisVersion, 2);
  });

  it("starts fresh run when cache lookup returns null (incompatible or expired)", async () => {
    let executed = false;
    const created = __testHelpers.sampleRun({ status: "queued", phase: "queued" });
    const running = __testHelpers.sampleRun({ status: "running", phase: "psi_mobile" });

    const result = await handlePostWebsiteCheckRun({
      request: makeRequest(),
      body: { url: "https://example.com" },
      envSource: liveEnv,
      scheduleAfter: (task) => {
        void task();
      },
      deps: {
        consumeWebsiteCheckRateLimit: async () => undefined,
        expireStaleWebsiteAnalysisRuns: async () => 0,
        findCachedWebsiteAnalysisByUrl: async () => null,
        findActiveWebsiteAnalysisRunByUrlHash: async () => null,
        createActiveWebsiteAnalysisRun: async () => ({ run: created, created: true }),
        transitionWebsiteAnalysisRunToRunning: async () => running,
        executeWebsiteAnalysisRun: async () => {
          executed = true;
        },
      },
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.status, 202);
    assert.equal(result.run.cacheHit, false);
    assert.equal(executed, true);
  });

  it("reuses an active run for the same URL hash", async () => {
    const active = __testHelpers.sampleRun({ status: "running", phase: "psi_mobile" });

    const result = await handlePostWebsiteCheckRun({
      request: makeRequest(),
      body: { url: "https://example.com" },
      envSource: liveEnv,
      deps: {
        consumeWebsiteCheckRateLimit: async () => undefined,
        expireStaleWebsiteAnalysisRuns: async () => 0,
        findCachedWebsiteAnalysisByUrl: async () => null,
        findActiveWebsiteAnalysisRunByUrlHash: async () => active,
      },
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.status, 202);
    assert.equal(result.run.id, active.id);
  });

  it("returns 429 when hourly rate limit is exceeded", async () => {
    const result = await handlePostWebsiteCheckRun({
      request: makeRequest(),
      body: { url: "https://example.com" },
      envSource: liveEnv,
      deps: {
        consumeWebsiteCheckRateLimit: async () => {
          throw new WebsiteCheckRateLimitError("hour");
        },
      },
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.status, 429);
  });

  it("schedules execution for a new run", async () => {
    const queued = __testHelpers.sampleRun({ status: "queued", phase: "queued" });
    const running = __testHelpers.sampleRun({ status: "running", phase: "psi_mobile" });
    const tasks: Array<() => Promise<void>> = [];
    let executeArgs: { runId: string } | null = null;

    const result = await handlePostWebsiteCheckRun({
      request: makeRequest(),
      body: { url: "https://example.com" },
      envSource: liveEnv,
      scheduleAfter: (task) => {
        tasks.push(task);
      },
      deps: {
        consumeWebsiteCheckRateLimit: async () => undefined,
        expireStaleWebsiteAnalysisRuns: async () => 0,
        findCachedWebsiteAnalysisByUrl: async () => null,
        findActiveWebsiteAnalysisRunByUrlHash: async () => null,
        createActiveWebsiteAnalysisRun: async () => ({ run: queued, created: true }),
        transitionWebsiteAnalysisRunToRunning: async () => running,
        executeWebsiteAnalysisRun: async (args) => {
          executeArgs = { runId: args.runId };
        },
      },
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.status, 202);
    assert.equal(tasks.length, 1);
    await tasks[0]?.();
    assert.deepEqual(executeArgs, { runId: running.id });
  });
});

describe("end-to-end analysis assembly for API persistence", () => {
  it("maps successful PSI fixture to completed status", () => {
    const analysis = assembleMobilePageSpeedAnalysisFromPayload(PSI_FIXTURE_COMPLETE);
    assert.equal(analysis.ok, true);
    if (!analysis.ok) return;
    assert.equal(analysis.status, "completed");
    assert.equal(analysis.scores.ux, 90);
  });
});
