"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { MdArrowForward, MdRefresh } from "react-icons/md";
import type { PublicWebsiteAnalysisRunDto } from "@/lib/website-check/public-run-dto";
import { buildWebsiteCheckResultsViewModel } from "@/lib/website-check/results-view-model";
import { useWebsiteCheckLivePoll } from "@/lib/website-check/useWebsiteCheckLivePoll";
import type { WebsiteCheckFlowMode } from "@/lib/website-check/types";
import WebsiteCheckAiRecommendations from "../components/WebsiteCheckAiRecommendations";
import WebsiteCheckContactModal from "../components/WebsiteCheckContactModal";
import WebsiteCheckResultsFindings from "../components/WebsiteCheckResultsFindings";
import WebsiteCheckResultsMetricCard from "../components/WebsiteCheckResultsMetricCard";
import WebsiteCheckResultsTechnicalSection from "../components/WebsiteCheckResultsTechnicalSection";
import { WEBSITE_CHECK_LIVE_RESULTS_COPY } from "../website-check-results-content";
import "./ResultsScreen.scss";

type ResultsScreenProps = {
  mode: WebsiteCheckFlowMode;
  url: string;
  analysisRun: PublicWebsiteAnalysisRunDto | null;
  runId: string | null;
  onBack: () => void;
  onRunUpdate?: (run: PublicWebsiteAnalysisRunDto) => void;
};

function OverallScoreRingUnavailable() {
  return (
    <div
      className="website-check-results__overall-ring website-check-results__overall-ring--unavailable"
      role="img"
      aria-label="ציון כללי לא זמין"
    >
      <span className="website-check-results__overall-unavailable">לא זמין</span>
    </div>
  );
}

function OverallScoreRingAnimated({ score, active }: { score: number; active: boolean }) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const [dashOffset, setDashOffset] = useState(() => (prefersReducedMotion ? offset : circumference));

  useEffect(() => {
    if (prefersReducedMotion || !active) {
      setDashOffset(active ? offset : circumference);
      return undefined;
    }
    setDashOffset(circumference);
    const timeout = window.setTimeout(() => setDashOffset(offset), 160);
    return () => window.clearTimeout(timeout);
  }, [active, circumference, offset, prefersReducedMotion, score]);

  return (
    <div className="website-check-results__overall-ring" aria-hidden>
      <span className="website-check-results__overall-halo" />
      <svg viewBox="0 0 168 168" className="website-check-results__overall-svg">
        <defs>
          <linearGradient id="wc-results-overall-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="45%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
        <circle className="website-check-results__overall-track" cx="84" cy="84" r={radius} />
        <circle
          className="website-check-results__overall-value"
          cx="84"
          cy="84"
          r={radius}
          stroke="url(#wc-results-overall-gradient)"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: prefersReducedMotion ? "none" : "stroke-dashoffset 1.1s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </svg>
      <div className="website-check-results__overall-center">
        <span className="website-check-results__overall-number" dir="ltr">
          {score}
        </span>
        <span className="website-check-results__overall-denom" dir="ltr">
          /100
        </span>
      </div>
    </div>
  );
}

function OverallScoreRing({ score, active }: { score: number | null; active: boolean }) {
  if (score === null) {
    return <OverallScoreRingUnavailable />;
  }
  return <OverallScoreRingAnimated score={score} active={active} />;
}

export default function ResultsScreen({
  mode,
  url,
  analysisRun,
  runId,
  onBack,
  onRunUpdate,
}: ResultsScreenProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [scoresActive, setScoresActive] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const { run: polledRun } = useWebsiteCheckLivePoll({
    runId: mode === "live" ? runId : null,
    enabled: mode === "live" && Boolean(runId),
    initialRun: analysisRun,
    onRunUpdate,
  });

  const effectiveRun = mode === "live" ? (polledRun ?? analysisRun) : null;

  const viewModel = useMemo(
    () => buildWebsiteCheckResultsViewModel(mode, effectiveRun),
    [mode, effectiveRun],
  );

  useEffect(() => {
    if (prefersReducedMotion) {
      setScoresActive(true);
      return undefined;
    }
    const timeout = window.setTimeout(() => setScoresActive(true), 200);
    return () => window.clearTimeout(timeout);
  }, [prefersReducedMotion]);

  if (!viewModel) {
    return (
      <section className="website-check-results website-check-results--missing" aria-labelledby="website-check-results-missing-title">
        <h1 id="website-check-results-missing-title" className="website-check-results__title">
          לא ניתן להציג את הדוח
        </h1>
        <p className="website-check-results__summary">
          {mode === "live"
            ? "נתוני הניתוח חסרים או שהסטטוס אינו מוכן להצגה. התחילו בדיקה חדשה."
            : "לא ניתן לטעון את דוח ההדגמה."}
        </p>
        <button type="button" className="website-check-results__action website-check-results__action--primary" onClick={onBack}>
          {WEBSITE_CHECK_LIVE_RESULTS_COPY.backLabel}
        </button>
      </section>
    );
  }

  const { copy } = viewModel;
  const isDemo = viewModel.mode === "demo";

  return (
    <section
      className={`website-check-results website-check-results--v2${viewModel.mode === "live" ? " website-check-results--live" : ""}`}
      aria-labelledby="website-check-results-url"
    >
      <div className="website-check-results__ambient" aria-hidden>
        <span className="website-check-results__ambient-beam website-check-results__ambient-beam--cyan" />
        <span className="website-check-results__ambient-beam website-check-results__ambient-beam--violet" />
      </div>

      <header className="website-check-results__toolbar">
        {isDemo ? (
          <p className="website-check-results__demo-banner" role="status">
            {copy.demoBanner}
          </p>
        ) : (
          <p className="website-check-results__live-chip" role="status">
            {copy.demoBanner}
          </p>
        )}
        {viewModel.cachedResultsBanner ? (
          <p className="website-check-results__cache-banner" role="status">
            {viewModel.cachedResultsBanner}
          </p>
        ) : null}
        {viewModel.partialBanner ? (
          <p className="website-check-results__partial-banner" role="status">
            {viewModel.partialBanner}
          </p>
        ) : null}
        <div className="website-check-results__toolbar-row">
          <div className="website-check-results__url-block">
            <span className="website-check-results__url-label">{copy.urlLabel}</span>
            <p id="website-check-results-url" className="website-check-results__url-value" dir="ltr" lang="en">
              {url}
            </p>
          </div>
          <div className="website-check-results__toolbar-actions">
            <button type="button" className="website-check-results__action website-check-results__action--ghost" onClick={onBack}>
              <MdArrowForward className="website-check-results__action-icon" aria-hidden />
              {copy.backLabel}
            </button>
            <button
              type="button"
              className="website-check-results__action website-check-results__action--primary"
              onClick={onBack}
              title={copy.restartHint}
            >
              <MdRefresh className="website-check-results__action-icon" aria-hidden />
              {copy.restartLabel}
            </button>
          </div>
        </div>
      </header>

      <article className="website-check-results__hero-card">
        <div className="website-check-results__hero-visual">
          <OverallScoreRing score={viewModel.overallScore} active={scoresActive} />
        </div>
        <div className="website-check-results__hero-copy">
          <h1 className="website-check-results__hero-headline">{viewModel.overallPresentation.headline}</h1>
          <p className="website-check-results__hero-support">{viewModel.overallPresentation.support}</p>
          <p className="website-check-results__hero-caption">{viewModel.overallCaption}</p>
        </div>
      </article>

      <section className="website-check-results__metrics-section" aria-labelledby="website-check-metrics-title">
        <h2 id="website-check-metrics-title" className="website-check-results__block-title website-check-results__block-title--sr">
          {copy.metricsHeading}
        </h2>
        <ul className="website-check-results__metrics website-check-results__metrics--row">
          {viewModel.metrics.map((metric) => (
            <WebsiteCheckResultsMetricCard key={metric.id} metric={metric} />
          ))}
        </ul>
      </section>

      <WebsiteCheckAiRecommendations
        heading={copy.aiRecommendationsHeading}
        loadingLabel={copy.aiLoadingLabel}
        demoNotice={isDemo ? copy.aiDemoNotice : null}
        aiInsights={isDemo ? undefined : viewModel.aiInsights ?? undefined}
      />

      {!isDemo && viewModel.showBusinessFindings ? (
        <WebsiteCheckResultsFindings
          heading={copy.mainFindingsHeading}
          demoNotice={null}
          findings={viewModel.businessFindings}
          emptyMessage={viewModel.strengthsWeaknesses.emptyPositiveMessage}
        />
      ) : null}

      {!isDemo && viewModel.verifiedStrengths.length > 0 ? (
        <section className="website-check-results__strengths-block" aria-labelledby="website-check-strengths-title">
          <h2 id="website-check-strengths-title" className="website-check-results__block-title">
            {copy.strengthsSectionHeading}
          </h2>
          <ul className="website-check-results__strengths-list">
            {viewModel.verifiedStrengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="website-check-results__cta" aria-labelledby="website-check-cta-title">
        <h2 id="website-check-cta-title" className="website-check-results__cta-title">
          {copy.ctaHeading}
        </h2>
        <p className="website-check-results__cta-body">{copy.ctaBody}</p>
        <button
          type="button"
          className="website-check-results__cta-button"
          onClick={() => setContactOpen(true)}
          disabled={isDemo}
        >
          {copy.ctaButtonLabel}
        </button>
      </section>

      {!isDemo ? (
        <WebsiteCheckContactModal
          open={contactOpen}
          websiteUrl={url}
          analysisRunId={runId}
          onClose={() => setContactOpen(false)}
        />
      ) : null}

      {viewModel.showTechnicalDetails ? (
        <WebsiteCheckResultsTechnicalSection
          copy={copy}
          findingGroups={viewModel.findingGroups}
          recommendations={viewModel.recommendations}
          metaLines={viewModel.metaLines}
        />
      ) : null}
    </section>
  );
}
