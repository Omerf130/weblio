import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AnalysisApiError,
  createWebsiteCheckRun,
  fetchWebsiteCheckConfig,
  getWebsiteCheckRun,
} from "../../src/lib/website-check/client/analysis-api";
import { toPublicWebsiteAnalysisRunDto } from "../../src/lib/website-check/public-run-dto";
import { __testHelpers } from "../../src/lib/website-check/api/post-website-check-run";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("fetchWebsiteCheckConfig", () => {
  it("returns liveAvailable true when config endpoint succeeds", async () => {
    const config = await fetchWebsiteCheckConfig(async () => jsonResponse({ liveAvailable: true }));
    assert.equal(config.liveAvailable, true);
  });

  it("returns liveAvailable false on HTTP error", async () => {
    const config = await fetchWebsiteCheckConfig(async () => jsonResponse({}, 500));
    assert.equal(config.liveAvailable, false);
  });

  it("returns liveAvailable false on invalid JSON", async () => {
    const config = await fetchWebsiteCheckConfig(async () => new Response("not-json", { status: 200 }));
    assert.equal(config.liveAvailable, false);
  });
});

describe("createWebsiteCheckRun", () => {
  const publicRun = toPublicWebsiteAnalysisRunDto(__testHelpers.sampleRun({ status: "queued" }));

  it("returns run on successful POST", async () => {
    const result = await createWebsiteCheckRun("https://example.com/", {
      fetchImpl: async () => jsonResponse({ run: publicRun }, 202),
    });
    assert.equal(result.run.id, publicRun.id);
    assert.equal(result.httpStatus, 202);
  });

  it("maps 400 to bad_request", async () => {
    await assert.rejects(
      () =>
        createWebsiteCheckRun("https://example.com/", {
          fetchImpl: async () => jsonResponse({ error: "כתובת לא תקינה" }, 400),
        }),
      (error: unknown) => {
        assert.ok(error instanceof AnalysisApiError);
        assert.equal(error.code, "bad_request");
        assert.equal(error.httpStatus, 400);
        assert.match(error.message, /כתובת/);
        return true;
      }
    );
  });

  it("maps 429 to rate_limit", async () => {
    await assert.rejects(
      () =>
        createWebsiteCheckRun("https://example.com/", {
          fetchImpl: async () => jsonResponse({ error: "יותר מדי בקשות" }, 429),
        }),
      (error: unknown) => {
        assert.ok(error instanceof AnalysisApiError);
        assert.equal(error.code, "rate_limit");
        return true;
      }
    );
  });

  it("maps 503 to unavailable", async () => {
    await assert.rejects(
      () =>
        createWebsiteCheckRun("https://example.com/", {
          fetchImpl: async () => jsonResponse({ error: "לא זמין" }, 503),
        }),
      (error: unknown) => {
        assert.ok(error instanceof AnalysisApiError);
        assert.equal(error.code, "unavailable");
        return true;
      }
    );
  });

  it("maps network failure to network code", async () => {
    await assert.rejects(
      () =>
        createWebsiteCheckRun("https://example.com/", {
          fetchImpl: async () => {
            throw new TypeError("fetch failed");
          },
        }),
      (error: unknown) => {
        assert.ok(error instanceof AnalysisApiError);
        assert.equal(error.code, "network");
        return true;
      }
    );
  });

  it("rejects invalid success payload", async () => {
    await assert.rejects(
      () =>
        createWebsiteCheckRun("https://example.com/", {
          fetchImpl: async () => jsonResponse({ run: {} }, 202),
        }),
      (error: unknown) => {
        assert.ok(error instanceof AnalysisApiError);
        assert.equal(error.code, "invalid_response");
        return true;
      }
    );
  });
});

describe("getWebsiteCheckRun", () => {
  it("returns run on GET success", async () => {
    const completed = toPublicWebsiteAnalysisRunDto(
      __testHelpers.sampleRun({ status: "completed", phase: "done" })
    );
    const run = await getWebsiteCheckRun(completed.id, {
      fetchImpl: async () => jsonResponse({ run: completed }),
    });
    assert.equal(run.status, "completed");
  });

  it("throws on non-OK GET", async () => {
    await assert.rejects(
      () =>
        getWebsiteCheckRun("507f1f77bcf86cd799439011", {
          fetchImpl: async () => jsonResponse({ error: "missing" }, 404),
        }),
      (error: unknown) => {
        assert.ok(error instanceof AnalysisApiError);
        assert.equal(error.code, "unknown");
        return true;
      }
    );
  });

  it("maps fetch errors to network code", async () => {
    await assert.rejects(
      () =>
        getWebsiteCheckRun("507f1f77bcf86cd799439011", {
          fetchImpl: async () => {
            throw new Error("offline");
          },
        }),
      (error: unknown) => {
        assert.ok(error instanceof AnalysisApiError);
        assert.equal(error.code, "network");
        return true;
      }
    );
  });
});
