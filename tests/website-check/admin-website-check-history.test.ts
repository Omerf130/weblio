import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ADMIN_WEBSITE_CHECK_FORBIDDEN_RESPONSE_KEYS,
  toAdminWebsiteCheckRunDetail,
} from "../../src/lib/admin/website-check/admin-run-mapper";
import {
  adminWebsiteCheckOverallDisplay,
  buildAdminWebsiteCheckRunFilter,
  escapeMongoRegexLiteral,
} from "../../src/lib/admin/website-check/list-query";
import { handleAdminWebsiteCheckRunDetailGet } from "../../src/lib/admin/website-check/handle-admin-website-check-run-detail";
import { handleAdminWebsiteCheckRunsGet } from "../../src/lib/admin/website-check/handle-admin-website-check-runs";
import { __testHelpers } from "../../src/lib/website-check/api/post-website-check-run";
import {
  WEBSITE_ANALYSIS_RUN_LEGACY_TTL_SECONDS,
  WEBSITE_ANALYSIS_RUN_TTL_SECONDS,
} from "../../src/lib/website-check/retention";
import { WebsiteAnalysisRun } from "../../src/models/WebsiteAnalysisRun";

function sampleDto(overrides: Parameters<typeof __testHelpers.sampleRun>[0] = {}) {
  return __testHelpers.sampleRun(overrides);
}

describe("website analysis run retention", () => {
  it("defines one-year TTL in seconds", () => {
    assert.equal(WEBSITE_ANALYSIS_RUN_TTL_SECONDS, 365 * 24 * 60 * 60);
    assert.equal(WEBSITE_ANALYSIS_RUN_LEGACY_TTL_SECONDS, 90 * 24 * 60 * 60);
  });

  it("registers Mongoose TTL index for 365 days on createdAt", () => {
    const indexes = WebsiteAnalysisRun.schema.indexes() as Array<
      [Record<string, number>, { expireAfterSeconds?: number }]
    >;
    const ttl = indexes.find(([key, opts]) => key.createdAt === 1 && opts.expireAfterSeconds);
    assert.ok(ttl);
    assert.equal(ttl![1].expireAfterSeconds, WEBSITE_ANALYSIS_RUN_TTL_SECONDS);
  });
});

describe("admin website-check list query", () => {
  it("escapes regex search input", () => {
    assert.match(escapeMongoRegexLiteral("weblio.co.il?a=1"), /weblio\\.co\\.il/);
  });

  it("builds status and lead filters", () => {
    const filter = buildAdminWebsiteCheckRunFilter({
      page: 1,
      pageSize: 20,
      status: "failed",
      hasLead: "yes",
      q: "example.com",
    });
    assert.equal(filter.status, "failed");
    assert.ok(filter.leadId);
    const urlFilter = filter.urlNormalized as { $regex: string };
    assert.match(urlFilter.$regex, /example/);
  });

  it("maps missing scores and failed runs for display", () => {
    assert.equal(adminWebsiteCheckOverallDisplay("failed", 80), "נכשל");
    assert.equal(adminWebsiteCheckOverallDisplay("running", null), "בבדיקה");
    assert.equal(adminWebsiteCheckOverallDisplay("completed", null), "לא זמין");
    assert.equal(adminWebsiteCheckOverallDisplay("completed", 77), "77");
  });
});

describe("admin website-check DTO safety", () => {
  it("does not expose clientMeta or ip fields in detail DTO", () => {
    const detail = toAdminWebsiteCheckRunDetail(
      sampleDto({
        status: "completed",
        phase: "done",
        scores: { performance: 90, seo: 88, accessibility: 91, ux: 85, overall: 89 },
        aiInsights: {
          status: "completed",
          source: "fallback",
          recommendations: [],
          positiveSummary: null,
        },
      })
    );
    const json = JSON.stringify(detail);
    for (const key of ADMIN_WEBSITE_CHECK_FORBIDDEN_RESPONSE_KEYS) {
      assert.equal(json.includes(key), false, `forbidden key leaked: ${key}`);
    }
    assert.equal(json.includes("secret"), false);
  });

  it("shows safe error summary for failed runs", () => {
    const detail = toAdminWebsiteCheckRunDetail(
      sampleDto({
        status: "failed",
        phase: "done",
        error: { code: "psi_timeout", messagePublic: "הניתוח נכשל." },
      })
    );
    assert.equal(detail.errorSummary, "הניתוח נכשל.");
    assert.equal(detail.scoreLabels.overall, "נכשל");
  });
});

describe("admin website-check API handlers", () => {
  it("rejects invalid pagination query", async () => {
    const result = await handleAdminWebsiteCheckRunsGet(new URLSearchParams("page=0"));
    assert.equal(result.ok, false);
  });

  it("returns 404 for missing run detail", async () => {
    const result = await handleAdminWebsiteCheckRunDetailGet("not-a-valid-object-id");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 404);
    }
  });
});
