import "server-only";

import OpenAI from "openai";
import { connectDB } from "@/lib/db/mongoose";
import { buildWebsiteCheckAiPromptInput } from "@/lib/website-check/ai/build-website-check-ai-input";
import {
  resolveWebsiteCheckAiEnv,
  type ResolvedWebsiteCheckAiEnv,
} from "@/lib/website-check/ai/website-check-ai-env";
import { buildWebsiteCheckAiResponsesCreateParams } from "@/lib/website-check/ai/website-check-openai-request";
import { logWebsiteCheckOpenAiError } from "@/lib/website-check/ai/website-check-openai-error-log";
import { buildFallbackAiRecommendationsFromFindings } from "@/lib/website-check/ai/website-check-ai-fallback";
import {
  normalizeWebsiteCheckAiPositiveSummary,
  toWebsiteCheckAiRecommendations,
  validateWebsiteCheckAiModelOutput,
} from "@/lib/website-check/ai/validate-website-check-ai-output";
import { mapLiveFindingForAiFallback } from "@/lib/website-check/ai/map-finding-for-ai";
import { getWebsiteAnalysisRunById } from "@/lib/data/website-analysis-runs";
import {
  buildWebsiteCheckRunDiagnostics,
  logWebsiteCheckRunDiagnostics,
} from "@/lib/website-check/website-check-dev-diagnostics";
import { WebsiteAnalysisRun } from "@/models/WebsiteAnalysisRun";
import type { WebsiteCheckAiInsights } from "@/types/website-check-ai";

function buildUserPrompt(input: ReturnType<typeof buildWebsiteCheckAiPromptInput>): string {
  return JSON.stringify(input);
}

async function callOpenAi(
  env: ResolvedWebsiteCheckAiEnv,
  userJson: string,
  envSource?: Record<string, string | undefined>
): Promise<unknown | null> {
  const client = new OpenAI({ apiKey: env.apiKey });
  const controller = AbortSignal.timeout(env.timeoutMs);

  try {
    const response = await client.responses.create(
      buildWebsiteCheckAiResponsesCreateParams(env, userJson),
      { timeout: env.timeoutMs, signal: controller }
    );

    const text = response.output_text;
    if (!text?.trim()) return null;
    return JSON.parse(text) as unknown;
  } catch (error) {
    logWebsiteCheckOpenAiError("responses.create", error, envSource);
    return null;
  }
}

export async function generateWebsiteCheckAiInsightsForRun(
  runId: string,
  envSource?: Record<string, string | undefined>
): Promise<void> {
  await connectDB();

  const locked = await WebsiteAnalysisRun.findOneAndUpdate(
    {
      _id: runId,
      status: { $in: ["completed", "partial"] },
      $or: [
        { aiInsights: { $exists: false } },
        { "aiInsights.status": "pending" },
      ],
    },
    { $set: { "aiInsights.status": "generating", "aiInsights.updatedAt": new Date() } },
    { new: false }
  ).lean();

  if (!locked) {
    return;
  }

  const run = await getWebsiteAnalysisRunById(runId);
  if (!run) {
    return;
  }

  const promptInput = buildWebsiteCheckAiPromptInput(run.scores, run.findings);
  const mappedFindings = run.findings.map(mapLiveFindingForAiFallback);

  const applyFallback = async (reason: string) => {
    const fallback = buildFallbackAiRecommendationsFromFindings(mappedFindings);
    const payload: WebsiteCheckAiInsights = {
      status: "completed",
      source: "fallback",
      recommendations: fallback.recommendations,
      positiveSummary: fallback.positiveSummary,
      updatedAt: new Date().toISOString(),
    };
    await WebsiteAnalysisRun.findByIdAndUpdate(runId, { $set: { aiInsights: payload } });
    console.warn(`[website-check-ai] fallback applied (${reason}) run=${runId}`);
    const updated = await getWebsiteAnalysisRunById(runId);
    if (updated) {
      logWebsiteCheckRunDiagnostics(
        `ai_fallback_${reason}`,
        buildWebsiteCheckRunDiagnostics(updated),
        envSource
      );
    }
  };

  const env = resolveWebsiteCheckAiEnv(envSource);
  if (!env) {
    await applyFallback("ai_disabled");
    return;
  }

  if (promptInput.findings.length === 0) {
    await WebsiteAnalysisRun.findByIdAndUpdate(runId, {
      $set: {
        aiInsights: {
          status: "completed",
          source: "fallback",
          recommendations: [],
          positiveSummary:
            "לא זוהו ממצאים משמעותיים בבדיקה האוטומטית. כדאי לשמור על האתר מעודכן.",
          updatedAt: new Date().toISOString(),
        } satisfies WebsiteCheckAiInsights,
      },
    });
    return;
  }

  const raw = await callOpenAi(env, buildUserPrompt(promptInput), envSource);
  const validated = raw ? validateWebsiteCheckAiModelOutput(raw, promptInput) : null;

  if (!validated) {
    await applyFallback("validation_or_api");
    return;
  }

  const recommendations = toWebsiteCheckAiRecommendations(validated);
  await WebsiteAnalysisRun.findByIdAndUpdate(runId, {
    $set: {
      aiInsights: {
        status: "completed",
        source: "openai",
        recommendations,
        positiveSummary: normalizeWebsiteCheckAiPositiveSummary(validated.positiveSummary),
        updatedAt: new Date().toISOString(),
      } satisfies WebsiteCheckAiInsights,
    },
  });

  const updated = await getWebsiteAnalysisRunById(runId);
  if (updated) {
    logWebsiteCheckRunDiagnostics("ai_openai_success", buildWebsiteCheckRunDiagnostics(updated), envSource);
  }
}

export async function ensureWebsiteCheckAiPending(runId: string): Promise<void> {
  await connectDB();
  await WebsiteAnalysisRun.findOneAndUpdate(
    { _id: runId, status: { $in: ["completed", "partial"] }, aiInsights: { $exists: false } },
    {
      $set: {
        aiInsights: {
          status: "pending",
          recommendations: [],
        },
      },
    }
  );
}
