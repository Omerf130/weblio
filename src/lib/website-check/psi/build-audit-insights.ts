import type {
  WebsiteAnalysisFinding,
  WebsiteAnalysisFindingCategory,
  WebsiteAnalysisRecommendation,
  WebsiteAnalysisRecommendationPriority,
} from "@/types/website-analysis-run";
import {
  extractPrimaryDocumentationUrl,
  stripMarkdownLinksForSummary,
} from "@/lib/website-check/lighthouse-text";
import type { PageSpeedLighthouseCategoryId } from "./pagespeed-categories";
import {
  classifyLighthouseAudit,
  isOpportunityAudit,
  shouldIncludeLighthouseFinding,
} from "./classify-lighthouse-audit";
import type { PsiAudit, PsiAuditRef, PsiPageSpeedResponse } from "./pagespeed-response-types";

const MAX_FINDINGS = 24;
const MAX_RECOMMENDATIONS = 16;

const CATEGORY_KEYS: PageSpeedLighthouseCategoryId[] = [
  "performance",
  "seo",
  "accessibility",
  "best-practices",
];

export type AuditInsightsResult = {
  findings: WebsiteAnalysisFinding[];
  recommendations: WebsiteAnalysisRecommendation[];
};

type RankedAudit = {
  auditId: string;
  audit: PsiAudit;
  weight: number;
  categoryId: PageSpeedLighthouseCategoryId;
};

function mapFindingCategory(categoryId: PageSpeedLighthouseCategoryId): WebsiteAnalysisFindingCategory {
  if (categoryId === "best-practices") {
    return "best-practices";
  }
  if (categoryId === "performance" || categoryId === "seo" || categoryId === "accessibility") {
    return categoryId;
  }
  return "other";
}

function recommendationPriority(audit: PsiAudit, weight: number): WebsiteAnalysisRecommendationPriority {
  if (typeof audit.score === "number" && audit.score <= 0.25) {
    return "high";
  }
  if (weight >= 3) {
    return "high";
  }
  if (typeof audit.details?.overallSavingsMs === "number" && audit.details.overallSavingsMs >= 500) {
    return "high";
  }
  if (typeof audit.score === "number" && audit.score < 0.9) {
    return "medium";
  }
  return "low";
}

function rankAudits(raw: PsiPageSpeedResponse): RankedAudit[] {
  const categories = raw.lighthouseResult?.categories ?? {};
  const audits = raw.lighthouseResult?.audits ?? {};
  const ranked: RankedAudit[] = [];
  const seen = new Set<string>();

  for (const categoryId of CATEGORY_KEYS) {
    const category = categories[categoryId];
    const refs: PsiAuditRef[] = category?.auditRefs ?? [];
    for (const ref of refs) {
      const auditId = ref.id?.trim();
      if (!auditId || seen.has(auditId)) continue;
      const audit = audits[auditId];
      if (!audit) continue;
      seen.add(auditId);
      ranked.push({
        auditId,
        audit,
        weight: typeof ref.weight === "number" ? ref.weight : 0,
        categoryId,
      });
    }
  }

  ranked.sort((a, b) => {
    const scoreA = typeof a.audit.score === "number" ? a.audit.score : 1;
    const scoreB = typeof b.audit.score === "number" ? b.audit.score : 1;
    const severityA = (1 - scoreA) * (a.weight + 1);
    const severityB = (1 - scoreB) * (b.weight + 1);
    return severityB - severityA;
  });

  return ranked;
}

function buildFindingId(auditId: string, index: number): string {
  return `finding-${auditId}-${index}`;
}

function buildRecommendationId(auditId: string, index: number): string {
  return `rec-${auditId}-${index}`;
}

export function buildAuditInsightsFromPageSpeedResponse(
  raw: PsiPageSpeedResponse
): AuditInsightsResult {
  const ranked = rankAudits(raw);
  const findings: WebsiteAnalysisFinding[] = [];
  const recommendations: WebsiteAnalysisRecommendation[] = [];

  for (const entry of ranked) {
    if (findings.length >= MAX_FINDINGS) {
      break;
    }
    if (!shouldIncludeLighthouseFinding(entry.audit)) {
      continue;
    }

    const classification = classifyLighthouseAudit(entry.audit);
    const title = entry.audit.title?.trim() || entry.auditId;
    const rawDescription = entry.audit.description?.trim() || "";
    const documentationUrl = extractPrimaryDocumentationUrl(rawDescription);
    const summaryText = stripMarkdownLinksForSummary(rawDescription) || title;

    findings.push({
      id: buildFindingId(entry.auditId, findings.length),
      auditId: entry.auditId,
      localeKey: entry.auditId,
      source: "lighthouse",
      status: classification.status,
      auditKind: classification.auditKind,
      category: mapFindingCategory(entry.categoryId),
      title,
      summary: summaryText,
      details: rawDescription || undefined,
      score: typeof entry.audit.score === "number" ? entry.audit.score : null,
      displayValue: entry.audit.displayValue?.trim() || null,
      documentationUrl,
    });
  }

  for (const entry of ranked) {
    if (recommendations.length >= MAX_RECOMMENDATIONS) {
      break;
    }

    const audit = entry.audit;
    const isOpportunity = isOpportunityAudit(audit);
    const classification = classifyLighthouseAudit(audit);
    if (!isOpportunity && classification.auditKind !== "failure") {
      continue;
    }
    if (classification.auditKind === "passed" || classification.auditKind === "diagnostic") {
      continue;
    }

    const title = audit.title?.trim() || entry.auditId;
    const rawDescription = audit.description?.trim() || "";
    const savings =
      typeof audit.details?.overallSavingsMs === "number"
        ? `Potential savings: ${audit.details.overallSavingsMs} ms`
        : undefined;

    recommendations.push({
      id: buildRecommendationId(entry.auditId, recommendations.length),
      auditId: entry.auditId,
      localeKey: entry.auditId,
      source: "lighthouse",
      priority: recommendationPriority(audit, entry.weight),
      title,
      summary: audit.displayValue?.trim() || stripMarkdownLinksForSummary(rawDescription) || title,
      details: [stripMarkdownLinksForSummary(rawDescription), savings].filter(Boolean).join("\n\n") || undefined,
    });
  }

  return { findings, recommendations };
}
