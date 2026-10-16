import {
  websiteCheckAiModelOutputSchema,
  type WebsiteCheckAiModelOutput,
} from "@/lib/website-check/ai/website-check-ai-schema";
import type { WebsiteCheckAiPromptInput } from "@/lib/website-check/ai/build-website-check-ai-input";
import { normalizeWebsiteCheckPublicCopy } from "@/lib/website-check/normalize-public-copy";
import type { WebsiteCheckAiRecommendation } from "@/types/website-check-ai";
import { createHash } from "node:crypto";

function allowedAuditIds(input: WebsiteCheckAiPromptInput): Set<string> {
  return new Set(input.findings.map((f) => f.auditId));
}

function allowedMetrics(input: WebsiteCheckAiPromptInput): Set<string> {
  const metrics = new Set<string>();
  for (const finding of input.findings) {
    if (finding.displayValue?.trim()) {
      metrics.add(finding.displayValue.trim());
    }
  }
  return metrics;
}

export function validateWebsiteCheckAiModelOutput(
  raw: unknown,
  input: WebsiteCheckAiPromptInput
): WebsiteCheckAiModelOutput | null {
  const parsed = websiteCheckAiModelOutputSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }

  const allowedAudits = allowedAuditIds(input);
  const allowedMetricValues = allowedMetrics(input);

  for (const rec of parsed.data.recommendations) {
    if (!rec.auditIds.every((id) => allowedAudits.has(id))) {
      return null;
    }
    if (rec.optionalMetric?.trim()) {
      const metric = rec.optionalMetric.trim();
      const allowedForRec = input.findings
        .filter((f) => rec.auditIds.includes(f.auditId))
        .map((f) => f.displayValue?.trim())
        .filter(Boolean) as string[];
      if (!allowedForRec.includes(metric) && !allowedMetricValues.has(metric)) {
        return null;
      }
    }
  }

  if (parsed.data.recommendations.length === 0 && !parsed.data.positiveSummary?.trim()) {
    return null;
  }

  return parsed.data;
}

export function toWebsiteCheckAiRecommendations(
  output: WebsiteCheckAiModelOutput
): WebsiteCheckAiRecommendation[] {
  return output.recommendations.slice(0, 3).map((rec, index) => ({
    id: `ai-${index + 1}-${hashFragment(rec.auditIds.join(","))}`,
    title: normalizeWebsiteCheckPublicCopy(rec.title),
    explanation: normalizeWebsiteCheckPublicCopy(rec.explanation),
    action: normalizeWebsiteCheckPublicCopy(rec.action),
    auditIds: rec.auditIds,
    optionalMetric: rec.optionalMetric?.trim()
      ? normalizeWebsiteCheckPublicCopy(rec.optionalMetric.trim())
      : null,
  }));
}

export function normalizeWebsiteCheckAiPositiveSummary(
  value: string | null | undefined
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return normalizeWebsiteCheckPublicCopy(trimmed);
}

function hashFragment(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex").slice(0, 10);
}
