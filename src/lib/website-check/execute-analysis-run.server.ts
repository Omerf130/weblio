import "server-only";

import { connectDB } from "@/lib/db/mongoose";
import type { PageSpeedFetchImpl } from "@/lib/website-check/psi/pagespeed-fetch";
import {
  ensureWebsiteCheckAiPending,
  generateWebsiteCheckAiInsightsForRun,
} from "@/lib/website-check/ai/generate-website-check-ai-insights.server";
import { buildWebsiteAnalysisRunPersistenceUpdate } from "@/lib/website-check/execute-analysis-persistence";
import { runMobilePageSpeedAnalysis } from "@/lib/website-check/psi/run-mobile-pagespeed-analysis.server";
import {
  buildWebsiteCheckAnalysisFailureDiagnostics,
  logWebsiteCheckAnalysisFailure,
} from "@/lib/website-check/website-check-analysis-failure-log";
import { WebsiteAnalysisRun } from "@/models/WebsiteAnalysisRun";

export type ExecuteWebsiteAnalysisRunOptions = {
  runId: string;
  fetchImpl?: PageSpeedFetchImpl;
  envSource?: Record<string, string | undefined>;
};

export async function executeWebsiteAnalysisRun(
  options: ExecuteWebsiteAnalysisRunOptions
): Promise<void> {
  await connectDB();

  const run = await WebsiteAnalysisRun.findById(options.runId).lean<{
    _id: unknown;
    urlNormalized: string;
    status: string;
  }>();

  if (!run || run.status !== "running") {
    return;
  }

  await WebsiteAnalysisRun.findByIdAndUpdate(options.runId, {
    $set: { phase: "psi_mobile" },
  });

  const analysisStartedAt = Date.now();
  const analysis = await runMobilePageSpeedAnalysis({
    url: run.urlNormalized,
    fetchImpl: options.fetchImpl,
    envSource: options.envSource,
  });

  if (!analysis.ok && analysis.error) {
    logWebsiteCheckAnalysisFailure(
      buildWebsiteCheckAnalysisFailureDiagnostics({
        runId: options.runId,
        urlNormalized: run.urlNormalized,
        phase: "psi_mobile",
        errorCode: analysis.error.code,
        messagePublic: analysis.error.messagePublic,
        elapsedMs: Date.now() - analysisStartedAt,
        psiFailure: analysis.psiFetchFailure,
      }),
      options.envSource
    );
  }

  const persistence = buildWebsiteAnalysisRunPersistenceUpdate(analysis);

  const setPayload: Record<string, unknown> = {
    status: persistence.status,
    phase: persistence.phase,
    completedAt: persistence.completedAt,
  };

  setPayload.analysisVersion = persistence.analysisVersion;
  if (persistence.scores !== undefined) setPayload.scores = persistence.scores;
  if (persistence.scoreMeta !== undefined) setPayload.scoreMeta = persistence.scoreMeta;
  if (persistence.findings !== undefined) setPayload.findings = persistence.findings;
  if (persistence.recommendations !== undefined) setPayload.recommendations = persistence.recommendations;
  if (persistence.fieldData !== undefined) setPayload.fieldData = persistence.fieldData;
  if (persistence.labMetrics !== undefined) setPayload.labMetrics = persistence.labMetrics;
  if (persistence.error !== undefined) setPayload.error = persistence.error;
  if (analysis.ok) setPayload.error = undefined;

  await WebsiteAnalysisRun.findOneAndUpdate(
    { _id: options.runId, status: "running" },
    {
      $set: setPayload,
      ...(persistence.unsetActiveUrlHash ? { $unset: { activeUrlHash: "" } } : {}),
    }
  );

  if (persistence.status === "completed" || persistence.status === "partial") {
    await ensureWebsiteCheckAiPending(options.runId);
    await generateWebsiteCheckAiInsightsForRun(options.runId, options.envSource);
  }
}
