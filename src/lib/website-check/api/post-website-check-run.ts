import { after } from "next/server";
import { resolveWebsiteCheckClientKey } from "@/lib/website-check/client-identity";
import { WEBSITE_CHECK_MAX_REQUEST_BODY_BYTES } from "@/lib/website-check/constants";
import type { ExecuteWebsiteAnalysisRunOptions } from "@/lib/website-check/execute-analysis-run.server";
import { isWebsiteCheckLiveAnalysisConfigured } from "@/lib/website-check/pagespeed-env";
import {
  toPublicWebsiteAnalysisRunDto,
  type PublicWebsiteAnalysisRunDto,
} from "@/lib/website-check/public-run-dto";
import type { PageSpeedFetchImpl } from "@/lib/website-check/psi/pagespeed-fetch";
import {
  WebsiteCheckRateLimitError,
  consumeWebsiteCheckRateLimit,
} from "@/lib/website-check/rate-limit";
import {
  getWebsiteAnalysisCacheIncompatibilityReason,
  WEBSITE_CHECK_ANALYSIS_VERSION,
} from "@/lib/website-check/analysis-version";
import {
  buildWebsiteCheckRunDiagnostics,
  logWebsiteCheckRunDiagnostics,
} from "@/lib/website-check/website-check-dev-diagnostics";
import { hashWebsiteAnalysisUrl } from "@/lib/website-check/url-hash";
import { validatePublicWebsiteUrl } from "@/lib/website-check/validate-public-url";
import {
  createActiveWebsiteAnalysisRun,
  expireStaleWebsiteAnalysisRuns,
  findActiveWebsiteAnalysisRunByUrlHash,
  findCachedWebsiteAnalysisByUrl,
  transitionWebsiteAnalysisRunToRunning,
} from "@/lib/data/website-analysis-runs";
import type { WebsiteAnalysisRunDto } from "@/types/website-analysis-run";
import { safeParseWebsiteCheckCreateRunInput } from "@/lib/validations/website-check";

const GENERIC_ERROR = "לא ניתן להתחיל ניתוח כרגע. נסו שוב מאוחר יותר.";
const NOT_CONFIGURED_ERROR = "שירות הניתוח אינו זמין כרגע.";
const RATE_LIMIT_HOUR = "הגעתם למגבלת הבדיקות לשעה. נסו שוב מאוחר יותר.";
const RATE_LIMIT_DAY = "הגעתם למגבלת הבדיקות היומית. נסו שוב מחר.";

export type PostWebsiteCheckRunResult =
  | { ok: true; status: 200 | 202; run: PublicWebsiteAnalysisRunDto }
  | { ok: false; status: 400 | 413 | 429 | 503 | 500; error: string };

export type WebsiteCheckPostRunDeps = {
  expireStaleWebsiteAnalysisRuns: typeof expireStaleWebsiteAnalysisRuns;
  findCachedWebsiteAnalysisByUrl: typeof findCachedWebsiteAnalysisByUrl;
  findActiveWebsiteAnalysisRunByUrlHash: typeof findActiveWebsiteAnalysisRunByUrlHash;
  createActiveWebsiteAnalysisRun: typeof createActiveWebsiteAnalysisRun;
  transitionWebsiteAnalysisRunToRunning: typeof transitionWebsiteAnalysisRunToRunning;
  consumeWebsiteCheckRateLimit: typeof consumeWebsiteCheckRateLimit;
  executeWebsiteAnalysisRun: (options: ExecuteWebsiteAnalysisRunOptions) => Promise<void>;
};

function getDefaultDeps(): WebsiteCheckPostRunDeps {
  return {
    expireStaleWebsiteAnalysisRuns,
    findCachedWebsiteAnalysisByUrl,
    findActiveWebsiteAnalysisRunByUrlHash,
    createActiveWebsiteAnalysisRun,
    transitionWebsiteAnalysisRunToRunning,
    consumeWebsiteCheckRateLimit,
    executeWebsiteAnalysisRun: async (options) => {
      const mod = await import("@/lib/website-check/execute-analysis-run.server");
      await mod.executeWebsiteAnalysisRun(options);
    },
  };
}

export type PostWebsiteCheckRunOptions = {
  request: Request;
  body: unknown;
  fetchImpl?: PageSpeedFetchImpl;
  envSource?: Record<string, string | undefined>;
  scheduleAfter?: (task: () => Promise<void>) => void;
  deps?: Partial<WebsiteCheckPostRunDeps>;
};

function sampleRun(overrides: Partial<WebsiteAnalysisRunDto> = {}): WebsiteAnalysisRunDto {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? "507f1f77bcf86cd799439011",
    urlNormalized: overrides.urlNormalized ?? "https://example.com/",
    urlHash: overrides.urlHash ?? "abc",
    status: overrides.status ?? "queued",
    phase: overrides.phase ?? "queued",
    scores: overrides.scores ?? {
      performance: null,
      seo: null,
      accessibility: null,
      ux: null,
      overall: null,
    },
    findings: overrides.findings ?? [],
    recommendations: overrides.recommendations ?? [],
    cacheHit: overrides.cacheHit ?? false,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    ...overrides,
  };
}

export async function handlePostWebsiteCheckRun(
  options: PostWebsiteCheckRunOptions
): Promise<PostWebsiteCheckRunResult> {
  const deps = { ...getDefaultDeps(), ...options.deps };

  if (!isWebsiteCheckLiveAnalysisConfigured(options.envSource)) {
    return { ok: false, status: 503, error: NOT_CONFIGURED_ERROR };
  }

  const contentLengthHeader = options.request.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number.parseInt(contentLengthHeader, 10);
    if (Number.isFinite(contentLength) && contentLength > WEBSITE_CHECK_MAX_REQUEST_BODY_BYTES) {
      return { ok: false, status: 413, error: GENERIC_ERROR };
    }
  }

  const clientKey = resolveWebsiteCheckClientKey(options.request);

  try {
    await deps.consumeWebsiteCheckRateLimit(clientKey);
  } catch (error: unknown) {
    if (error instanceof WebsiteCheckRateLimitError) {
      return {
        ok: false,
        status: 429,
        error: error.violation === "day" ? RATE_LIMIT_DAY : RATE_LIMIT_HOUR,
      };
    }
    return { ok: false, status: 500, error: GENERIC_ERROR };
  }

  const parsed = safeParseWebsiteCheckCreateRunInput(options.body);
  if (!parsed.success) {
    return { ok: false, status: 400, error: GENERIC_ERROR };
  }

  const validated = validatePublicWebsiteUrl(parsed.data.url);
  if (!validated.ok) {
    return { ok: false, status: 400, error: validated.message };
  }

  await deps.expireStaleWebsiteAnalysisRuns();

  const cached = await deps.findCachedWebsiteAnalysisByUrl(validated.normalized);
  if (cached) {
    logWebsiteCheckRunDiagnostics(
      "cache_hit",
      buildWebsiteCheckRunDiagnostics(cached, { cacheHit: true }),
      options.envSource
    );
    return {
      ok: true,
      status: 200,
      run: toPublicWebsiteAnalysisRunDto(cached, { cacheHit: true }),
    };
  }

  logWebsiteCheckRunDiagnostics(
    "cache_miss",
    {
      runId: "pending",
      cacheHit: false,
      analysisVersion: null,
      expectedAnalysisVersion: WEBSITE_CHECK_ANALYSIS_VERSION,
      bestPracticesScorePresent: false,
      aiStatus: null,
      aiSource: null,
      cacheIncompatibility: getWebsiteAnalysisCacheIncompatibilityReason({
        analysisVersion: undefined,
        aiInsights: undefined,
      }),
    },
    options.envSource
  );

  const urlHash = hashWebsiteAnalysisUrl(validated.normalized);

  const active = await deps.findActiveWebsiteAnalysisRunByUrlHash(urlHash);
  if (active) {
    return {
      ok: true,
      status: 202,
      run: toPublicWebsiteAnalysisRunDto(active),
    };
  }

  const { run: createdRun, created } = await deps.createActiveWebsiteAnalysisRun({
    urlNormalized: validated.normalized,
    urlHash,
    clientMeta: { ipHash: clientKey },
  });

  if (!created) {
    return {
      ok: true,
      status: 202,
      run: toPublicWebsiteAnalysisRunDto(createdRun),
    };
  }

  const running = await deps.transitionWebsiteAnalysisRunToRunning(createdRun.id);
  const runForResponse = running ?? createdRun;

  const schedule =
    options.scheduleAfter ??
    ((task: () => Promise<void>) => {
      after(task);
    });

  schedule(async () => {
    try {
      await deps.executeWebsiteAnalysisRun({
        runId: runForResponse.id,
        fetchImpl: options.fetchImpl,
        envSource: options.envSource,
      });
    } catch {
      await deps.expireStaleWebsiteAnalysisRuns();
    }
  });

  return {
    ok: true,
    status: 202,
    run: toPublicWebsiteAnalysisRunDto(runForResponse),
  };
}

/** @internal test helper */
export const __testHelpers = { sampleRun };
