import type { AnalyzerMetricAccent, AnalyzerMetricId } from "@/components/analyzer/analyzer-content";
import {
  extractPrimaryDocumentationUrl,
  stripMarkdownLinksForSummary,
} from "@/lib/website-check/lighthouse-text";
import type { PublicWebsiteAnalysisRunDto } from "@/lib/website-check/public-run-dto";
import type {
  WebsiteAnalysisFinding,
  WebsiteAnalysisRecommendation,
} from "@/types/website-analysis-run";
import {
  buildOverallSummaryPresentation,
  buildStrengthsWeaknessesSummary,
  buildVerifiedStrengths,
  selectPrioritizedBusinessFindings,
  type BusinessFindingView,
  type StrengthsWeaknessesSummary,
  type WebsiteCheckOverallPresentation,
} from "@/lib/website-check/business-report";
import { buildFallbackAiRecommendationsFromFindings } from "@/lib/website-check/ai/website-check-ai-fallback";
import { buildWebsiteCheckCachedResultsPublicMessage } from "@/lib/website-check/cached-results-public-message";
import { isWebsiteCheckAiInsightsInProgress } from "@/lib/website-check/ai-insights-status";
import type { PublicWebsiteCheckAiInsights } from "@/types/website-check-ai";
import type { WebsiteCheckFlowMode } from "./types";
import {
  WEBSITE_CHECK_DEMO_FINDINGS,
  WEBSITE_CHECK_DEMO_METRICS,
  WEBSITE_CHECK_DEMO_OVERALL_SCORE,
  WEBSITE_CHECK_DEMO_RECOMMENDATIONS,
  WEBSITE_CHECK_LIVE_OVERALL_UNAVAILABLE,
  WEBSITE_CHECK_LIVE_PARTIAL_BANNER,
  WEBSITE_CHECK_LIVE_RESULTS_COPY,
  WEBSITE_CHECK_LIVE_RESULTS_META,
  WEBSITE_CHECK_RESULTS_COPY,
  type WebsiteCheckAuditKind,
  type WebsiteCheckFinding,
  type WebsiteCheckFindingCategory,
  type WebsiteCheckFindingStatus,
  type WebsiteCheckRecommendation,
  type WebsiteCheckResultsCopy,
  type WebsiteCheckResultsMetricView,
} from "@/views/website-check/website-check-results-content";

const FINDING_CATEGORY_ORDER: WebsiteCheckFindingCategory[] = [
  "performance",
  "seo",
  "accessibility",
  "best-practices",
  "other",
];

export type WebsiteCheckResultsMetaLine = {
  id: string;
  label: string;
  value: string;
};

export type WebsiteCheckResultsViewModel = {
  mode: WebsiteCheckFlowMode;
  copy: WebsiteCheckResultsCopy;
  overallScore: number | null;
  overallStatusLabel: string;
  overallCaption: string;
  metrics: readonly WebsiteCheckResultsMetricView[];
  findings: readonly WebsiteCheckFinding[];
  recommendations: readonly WebsiteCheckRecommendation[];
  executiveSummary: string;
  topFindings: readonly WebsiteCheckFinding[];
  findingGroups: readonly {
    category: WebsiteCheckFindingCategory | undefined;
    label: string;
    findings: readonly WebsiteCheckFinding[];
  }[];
  metaLines: readonly WebsiteCheckResultsMetaLine[];
  partialBanner: string | null;
  showTechnicalDetails: boolean;
  businessFindings: readonly BusinessFindingView[];
  strengthsWeaknesses: StrengthsWeaknessesSummary;
  practicalRecommendations: readonly string[];
  overallPresentation: WebsiteCheckOverallPresentation;
  verifiedStrengths: readonly string[];
  aiInsights: PublicWebsiteCheckAiInsights | null;
  showBusinessFindings: boolean;
  cachedResultsBanner: string | null;
};

const METRIC_ACCENTS: Record<AnalyzerMetricId, AnalyzerMetricAccent> = {
  performance: "green",
  seo: "amber",
  accessibility: "blue",
  ux: "purple",
};

const METRIC_LABELS: Record<AnalyzerMetricId, string> = {
  performance: "מהירות וביצועים",
  seo: "התאמה למנועי חיפוש",
  accessibility: "נגישות בסיסית",
  ux: "תקינות האתר",
};

const LIVE_METRIC_DESCRIPTIONS: Record<AnalyzerMetricId, string> = {
  performance: "מדידת מהירות במעבדה (mobile). לא חוויית גולשים אמיתית.",
  seo: "בדיקות SEO טכניות. לא משקפות דירוג בגוגל.",
  accessibility: "בדיקות נגישות אוטומטיות. לא מחליפות ביקורת מלאה.",
  ux: "בדיקות Best Practices טכניות. לא ביקורת אבטחה מקיפה.",
};

function scoreStatusLabel(_category: AnalyzerMetricId, score: number | null): string {
  if (score === null) {
    return "לא זמין";
  }
  if (score >= 90) return "חזק";
  if (score >= 50) return "לשיפור";
  return "דורש תשומת לב";
}

function mapFindingStatus(status: WebsiteAnalysisFinding["status"]): WebsiteCheckFindingStatus {
  if (status === "failed") return "failed";
  if (status === "positive" || status === "warning" || status === "neutral") return status;
  return "neutral";
}

function inferAuditKind(finding: WebsiteAnalysisFinding): WebsiteCheckAuditKind {
  if (finding.auditKind) {
    return finding.auditKind;
  }
  if (finding.status === "failed") return "failure";
  if (finding.status === "positive") return "passed";
  if (finding.status === "neutral") return "diagnostic";
  return "opportunity";
}

function buildFindingDetails(finding: WebsiteAnalysisFinding): string {
  const parts: string[] = [];
  const raw = finding.details?.trim() || finding.summary;
  if (raw) {
    parts.push(raw);
  }
  if (finding.displayValue?.trim()) {
    parts.push(`ערך מדיד: ${finding.displayValue.trim()}`);
  }
  if (typeof finding.score === "number" && Number.isFinite(finding.score)) {
    parts.push(`ציון ביקורת (Lighthouse): ${Math.round(finding.score * 100)}`);
  }
  return parts.join("\n\n") || finding.summary;
}

function mapLiveFinding(finding: WebsiteAnalysisFinding): WebsiteCheckFinding {
  const rawDetails = finding.details?.trim() || finding.summary;
  const documentationUrl =
    finding.documentationUrl ?? extractPrimaryDocumentationUrl(rawDetails);

  return {
    id: finding.id,
    status: mapFindingStatus(finding.status),
    auditKind: inferAuditKind(finding),
    category: finding.category ?? "other",
    title: finding.title,
    summary: stripMarkdownLinksForSummary(finding.summary) || finding.title,
    details: buildFindingDetails(finding),
    documentationUrl,
    auditId: finding.auditId,
    displayValue: finding.displayValue ?? null,
    score: finding.score ?? null,
  };
}

function actionablePriority(finding: WebsiteCheckFinding): number {
  const kind = finding.auditKind ?? "diagnostic";
  if (kind === "failure") return 0;
  if (kind === "opportunity") return 1;
  if (finding.status === "failed") return 0;
  if (finding.status === "warning") return 2;
  return 9;
}

function selectTopFindings(findings: readonly WebsiteCheckFinding[], limit = 3): WebsiteCheckFinding[] {
  return [...findings]
    .filter((finding) => {
      const kind = finding.auditKind ?? "diagnostic";
      return kind === "failure" || kind === "opportunity" || finding.status === "failed" || finding.status === "warning";
    })
    .sort((a, b) => actionablePriority(a) - actionablePriority(b))
    .slice(0, limit);
}

function groupFindingsByCategory(
  findings: readonly WebsiteCheckFinding[],
  copy: WebsiteCheckResultsCopy
): WebsiteCheckResultsViewModel["findingGroups"] {
  const buckets = new Map<WebsiteCheckFindingCategory, WebsiteCheckFinding[]>();
  for (const finding of findings) {
    const key = finding.category ?? "other";
    const list = buckets.get(key) ?? [];
    list.push(finding);
    buckets.set(key, list);
  }

  return FINDING_CATEGORY_ORDER.map((category) => ({
    category,
    label: copy.categoryLabels[category],
    findings: buckets.get(category) ?? [],
  })).filter((group) => group.findings.length > 0);
}

function buildDemoExecutiveSummary(): string {
  return "דוח הדגמה: ציון כללי 82/100 (סטטי). אין ניתוח PageSpeed אמיתי - הממצאים להמחשת הממשק בלבד.";
}

function buildPracticalRecommendations(businessFindings: readonly BusinessFindingView[]): string[] {
  const seen = new Set<string>();
  const items: string[] = [];
  for (const finding of businessFindings) {
    const line = finding.whatToDo.trim();
    if (!line || seen.has(line)) continue;
    seen.add(line);
    items.push(line);
  }
  return items;
}

function mapLiveRecommendation(rec: WebsiteAnalysisRecommendation): WebsiteCheckRecommendation {
  const parts: string[] = [];
  if (rec.details?.trim()) {
    parts.push(rec.details.trim());
  }
  if (rec.auditId?.trim()) {
    parts.push(`מזהה ביקורת: ${rec.auditId.trim()}`);
  }
  return {
    id: rec.id,
    priority: rec.priority,
    title: rec.title,
    summary: rec.summary,
    details: parts.length > 0 ? parts.join("\n\n") : rec.summary,
  };
}

function formatAnalysisTimestamp(run: PublicWebsiteAnalysisRunDto): string {
  const raw = run.completedAt ?? run.labMetrics?.fetchTime ?? run.updatedAt;
  if (!raw) return "לא זמין";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function buildLiveMetaLines(run: PublicWebsiteAnalysisRunDto): WebsiteCheckResultsMetaLine[] {
  const strategy = run.scoreMeta?.primaryStrategy ?? run.labMetrics?.strategy ?? "mobile";
  const lighthouseVersion = run.scoreMeta?.lighthouseVersion?.trim();

  const lines: WebsiteCheckResultsMetaLine[] = [
    {
      id: "strategy",
      label: WEBSITE_CHECK_LIVE_RESULTS_META.metaStrategyLabel,
      value:
        strategy === "mobile"
          ? WEBSITE_CHECK_LIVE_RESULTS_META.metaStrategyMobile
          : WEBSITE_CHECK_LIVE_RESULTS_META.metaStrategyDesktop,
    },
    {
      id: "timestamp",
      label: WEBSITE_CHECK_LIVE_RESULTS_META.metaTimestampLabel,
      value: formatAnalysisTimestamp(run),
    },
    {
      id: "lab",
      label: WEBSITE_CHECK_LIVE_RESULTS_META.metaLabLabel,
      value: WEBSITE_CHECK_LIVE_RESULTS_META.metaLabValue,
    },
    {
      id: "field",
      label: WEBSITE_CHECK_LIVE_RESULTS_META.metaFieldLabel,
      value: run.fieldData?.available
        ? WEBSITE_CHECK_LIVE_RESULTS_META.metaFieldAvailable
        : WEBSITE_CHECK_LIVE_RESULTS_META.metaFieldUnavailable,
    },
  ];

  if (lighthouseVersion) {
    lines.push({
      id: "lighthouse",
      label: WEBSITE_CHECK_LIVE_RESULTS_META.metaLighthouseLabel,
      value: lighthouseVersion,
    });
  }

  if (run.cacheHit) {
    lines.push({
      id: "cache",
      label: WEBSITE_CHECK_LIVE_RESULTS_META.metaCacheLabel,
      value: WEBSITE_CHECK_LIVE_RESULTS_META.metaCacheValue,
    });
  }

  return lines;
}

function resolveLiveAiInsights(
  run: PublicWebsiteAnalysisRunDto,
  mappedFindings: WebsiteCheckFinding[]
): PublicWebsiteCheckAiInsights {
  if (run.aiInsights) {
    return {
      status: run.aiInsights.status,
      recommendations: run.aiInsights.recommendations,
      positiveSummary: run.aiInsights.positiveSummary ?? null,
    };
  }

  const fallback = buildFallbackAiRecommendationsFromFindings(mappedFindings);
  return {
    status: "completed",
    recommendations: fallback.recommendations,
    positiveSummary: fallback.positiveSummary,
  };
}

function shouldShowBusinessFindings(ai: PublicWebsiteCheckAiInsights): boolean {
  if (isWebsiteCheckAiInsightsInProgress(ai.status)) {
    return false;
  }
  if (ai.recommendations.length > 0) {
    return false;
  }
  if (ai.positiveSummary?.trim()) {
    return false;
  }
  return true;
}

function buildOverallCaption(run: PublicWebsiteAnalysisRunDto, overallScore: number | null): string {
  if (overallScore === null) {
    return WEBSITE_CHECK_LIVE_OVERALL_UNAVAILABLE;
  }
  const measured = run.scoreMeta?.availableCategories?.length ?? 0;
  const suffix =
    measured >= 4
      ? "ציון משוקלל מארבעת התחומים שנמדדו (מהירות, SEO, נגישות, תקינות)."
      : measured > 0
        ? `ציון משוקלל מ-${measured} תחומים שנמדו בבדיקה (משקלים מותאמים לקטגוריות זמינות).`
        : "";
  return `${overallScore} מתוך 100. ${suffix}`.trim();
}

function bestPracticesUnavailableReason(run: PublicWebsiteAnalysisRunDto): string | null {
  if (run.scores.ux !== null) {
    return null;
  }
  const missing = run.scoreMeta?.missingLighthouseCategories ?? [];
  if (missing.includes("best-practices")) {
    return "Lighthouse לא החזיר ציון Best Practices בתשובת PageSpeed.";
  }
  if (run.analysisVersion === undefined || run.analysisVersion < 2) {
    return "בדיקה ישנה לפני הוספת תחום «תקינות האתר». הריצו ניתוח חדש.";
  }
  return "ציון Best Practices לא זמין בנתוני הבדיקה.";
}

function buildLiveMetrics(run: PublicWebsiteAnalysisRunDto): WebsiteCheckResultsMetricView[] {
  const ids: AnalyzerMetricId[] = ["performance", "seo", "accessibility", "ux"];
  const bpReason = bestPracticesUnavailableReason(run);
  return ids.map((id) => {
    const score = run.scores[id];
    let description = LIVE_METRIC_DESCRIPTIONS[id];
    if (id === "ux" && score === null && bpReason) {
      description = `${description} ${bpReason}`;
    }
    return {
      id,
      label: METRIC_LABELS[id],
      score,
      accent: METRIC_ACCENTS[id],
      description,
      statusLabel: scoreStatusLabel(id, score),
      unavailable: score === null,
    };
  });
}

function buildCachedResultsBanner(run: PublicWebsiteAnalysisRunDto): string | null {
  if (!run.cacheHit) {
    return null;
  }
  return buildWebsiteCheckCachedResultsPublicMessage(run.completedAt);
}

export function buildDemoResultsViewModel(): WebsiteCheckResultsViewModel {
  const copy = WEBSITE_CHECK_RESULTS_COPY;
  const demoFindings: WebsiteCheckFinding[] = WEBSITE_CHECK_DEMO_FINDINGS.map((finding, index) => ({
    ...finding,
    auditKind: index === 0 ? "opportunity" : finding.status === "positive" ? "passed" : "opportunity",
    category: (["performance", "seo", "accessibility", "ux"][index] ?? "other") as WebsiteCheckFindingCategory,
  }));

  return {
    mode: "demo",
    copy,
    overallScore: WEBSITE_CHECK_DEMO_OVERALL_SCORE,
    overallStatusLabel: copy.overallStatusLabel,
    overallCaption: copy.overallCaption,
    metrics: WEBSITE_CHECK_DEMO_METRICS,
    findings: demoFindings,
    recommendations: WEBSITE_CHECK_DEMO_RECOMMENDATIONS,
    executiveSummary: buildDemoExecutiveSummary(),
    topFindings: selectTopFindings(demoFindings, 3),
    findingGroups: groupFindingsByCategory(demoFindings, copy),
    metaLines: [],
    partialBanner: null,
    showTechnicalDetails: false,
    businessFindings: [],
    strengthsWeaknesses: {
      strengths: [],
      weaknesses: [],
      emptyPositiveMessage: null,
    },
    practicalRecommendations: [],
    overallPresentation: buildOverallSummaryPresentation(WEBSITE_CHECK_DEMO_OVERALL_SCORE, 0),
    verifiedStrengths: [],
    aiInsights: null,
    showBusinessFindings: false,
    cachedResultsBanner: null,
  };
}

export function buildLiveResultsViewModel(run: PublicWebsiteAnalysisRunDto): WebsiteCheckResultsViewModel {
  const overallScore = run.scores.overall;
  const findings = run.findings.map(mapLiveFinding);
  const recommendations = run.recommendations.map(mapLiveRecommendation);

  const copy = WEBSITE_CHECK_LIVE_RESULTS_COPY;
  const businessFindings = selectPrioritizedBusinessFindings(findings);
  const strengthsWeaknesses = buildStrengthsWeaknessesSummary(run.scores, businessFindings);
  const verifiedStrengths = buildVerifiedStrengths(run.scores);
  const overallPresentation = buildOverallSummaryPresentation(overallScore, businessFindings.length);
  const aiInsights = resolveLiveAiInsights(run, findings);
  const showBusinessFindings = shouldShowBusinessFindings(aiInsights);

  return {
    mode: "live",
    copy,
    overallScore,
    overallStatusLabel: overallPresentation.headline,
    overallCaption: buildOverallCaption(run, overallScore),
    metrics: buildLiveMetrics(run),
    findings,
    recommendations,
    executiveSummary: overallPresentation.support,
    topFindings: selectTopFindings(findings, 3),
    findingGroups: groupFindingsByCategory(findings, copy),
    metaLines: buildLiveMetaLines(run),
    partialBanner: run.status === "partial" ? WEBSITE_CHECK_LIVE_PARTIAL_BANNER : null,
    showTechnicalDetails: true,
    businessFindings,
    strengthsWeaknesses,
    practicalRecommendations: buildPracticalRecommendations(businessFindings),
    overallPresentation,
    verifiedStrengths,
    aiInsights,
    showBusinessFindings,
    cachedResultsBanner: buildCachedResultsBanner(run),
  };
}

export function buildWebsiteCheckResultsViewModel(
  mode: WebsiteCheckFlowMode,
  analysisRun: PublicWebsiteAnalysisRunDto | null
): WebsiteCheckResultsViewModel | null {
  if (mode === "demo") {
    return buildDemoResultsViewModel();
  }
  if (!analysisRun) {
    return null;
  }
  if (analysisRun.status !== "completed" && analysisRun.status !== "partial") {
    return null;
  }
  return buildLiveResultsViewModel(analysisRun);
}

export function isLiveResultsReady(run: PublicWebsiteAnalysisRunDto | null): run is PublicWebsiteAnalysisRunDto {
  return Boolean(run && (run.status === "completed" || run.status === "partial"));
}
