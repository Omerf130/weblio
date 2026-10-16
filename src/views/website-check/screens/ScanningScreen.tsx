"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MdRefresh, MdArrowForward } from "react-icons/md";
import type { WebsiteCheckFlowMode } from "@/lib/website-check/types";
import { getLiveScanVisualState } from "@/lib/website-check/live-scan-visual";
import type { PublicWebsiteAnalysisRunDto } from "@/lib/website-check/public-run-dto";
import { useWebsiteCheckLivePoll } from "@/lib/website-check/useWebsiteCheckLivePoll";
import { useWebsiteCheckScanDemo } from "@/lib/website-check/useWebsiteCheckScanDemo";
import WebsiteCheckScanTimeline from "../components/WebsiteCheckScanTimeline";
import { WEBSITE_CHECK_COPY } from "../website-check-content";
import "./ScanningScreen.scss";

type ScanningScreenProps = {
  flowMode: WebsiteCheckFlowMode;
  url: string;
  runId: string | null;
  initialRun: PublicWebsiteAnalysisRunDto | null;
  onBack: () => void;
  onViewResults: () => void;
  onRunUpdate: (run: PublicWebsiteAnalysisRunDto) => void;
};

function formatProgressLabel(progress: number): string {
  return `${Math.round(progress)}%`;
}

function formatScoreSummary(run: PublicWebsiteAnalysisRunDto): string | null {
  const parts: string[] = [];
  if (run.scores.overall !== null) {
    parts.push(`ציון כללי: ${run.scores.overall}/100`);
  }
  if (run.scores.performance !== null) {
    parts.push(`ביצועים: ${run.scores.performance}`);
  }
  if (run.scores.seo !== null) {
    parts.push(`SEO: ${run.scores.seo}`);
  }
  if (run.scores.accessibility !== null) {
    parts.push(`נגישות: ${run.scores.accessibility}`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export default function ScanningScreen({
  flowMode,
  url,
  runId,
  initialRun,
  onBack,
  onViewResults,
  onRunUpdate,
}: ScanningScreenProps) {
  const prefersReducedMotion = useReducedMotion();
  const isLive = flowMode === "live";

  const demo = useWebsiteCheckScanDemo(!isLive);
  const livePoll = useWebsiteCheckLivePoll({
    runId: isLive ? runId : null,
    enabled: isLive && Boolean(runId),
    initialRun,
    onRunUpdate,
  });

  const liveVisual = getLiveScanVisualState(livePoll.run ?? initialRun);
  const stageStatuses = isLive ? liveVisual.stageStatuses : demo.stageStatuses;
  const timelineProgress = isLive ? liveVisual.timelineBeamProgress : demo.progress;
  const indeterminate = isLive && liveVisual.indeterminateProgress;
  const statusLabel = isLive ? liveVisual.statusLabel : demo.statusLabel;
  const activityLine = isLive
    ? livePoll.pollError ?? liveVisual.activityLine
    : demo.activityLine;
  const isComplete = isLive ? liveVisual.isComplete : demo.isComplete;
  const isFailed = isLive && liveVisual.isFailed;
  const isBusy = isLive ? livePoll.isPolling && !isComplete && !isFailed : !demo.isComplete;

  const banner = isLive
    ? WEBSITE_CHECK_COPY.scanning.liveBanner
    : WEBSITE_CHECK_COPY.scanning.demoBanner;

  const urlLabel = isLive
    ? WEBSITE_CHECK_COPY.scanning.liveUrlLabel
    : WEBSITE_CHECK_COPY.scanning.urlLabel;

  const progressAriaLabel = isLive
    ? WEBSITE_CHECK_COPY.scanning.liveProgressAriaLabel
    : WEBSITE_CHECK_COPY.scanning.progressAriaLabel;

  return (
    <section
      className={`website-check-scanning${isLive ? " website-check-scanning--live" : ""}`}
      aria-labelledby="website-check-scanning-title"
      aria-busy={isBusy}
    >
      <div className="website-check-scanning__hero-glow" aria-hidden />

      <p className="website-check-scanning__demo-banner" role="status">
        {banner}
      </p>

      <header className="website-check-scanning__header">
        <h1 id="website-check-scanning-title" className="website-check-scanning__title">
          {isLive ? WEBSITE_CHECK_COPY.scanning.liveTitle : WEBSITE_CHECK_COPY.scanning.title}
        </h1>
        <p className="website-check-scanning__body">
          {isLive ? WEBSITE_CHECK_COPY.scanning.liveBody : WEBSITE_CHECK_COPY.scanning.body}
        </p>

        <p className="website-check-scanning__url">
          <span className="website-check-scanning__url-label">{urlLabel}</span>
          <span className="website-check-scanning__url-value" dir="ltr" lang="en">
            {url}
          </span>
        </p>
      </header>

      <WebsiteCheckScanTimeline
        stageStatuses={stageStatuses}
        progress={timelineProgress}
        indeterminateBeam={indeterminate}
      />

      <div className="website-check-scanning__progress-block">
        <div className="website-check-scanning__progress-meta">
          <span className="website-check-scanning__progress-status">{statusLabel}</span>
          {!isLive ? (
            <span className="website-check-scanning__progress-percent" aria-hidden>
              {formatProgressLabel(demo.progress)}
            </span>
          ) : null}
        </div>

        <div
          className={`website-check-scanning__progress-track${indeterminate ? " website-check-scanning__progress-track--indeterminate" : ""}`}
          role="progressbar"
          aria-busy={indeterminate ? true : undefined}
          aria-valuemin={indeterminate ? undefined : 0}
          aria-valuemax={indeterminate ? undefined : 100}
          aria-valuenow={indeterminate ? undefined : Math.round(timelineProgress)}
          aria-label={progressAriaLabel}
        >
          {indeterminate ? (
            <span className="website-check-scanning__progress-fill-wrap website-check-scanning__progress-fill-wrap--indeterminate" aria-hidden />
          ) : (
            <motion.div
              className="website-check-scanning__progress-fill-wrap"
              initial={false}
              animate={{
                width:
                  !isLive && demo.progress >= 100
                    ? "calc(100% - 6px)"
                    : isLive && isComplete
                      ? "calc(100% - 6px)"
                      : `calc((100% - 6px) * ${timelineProgress} / 100)`,
              }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 120, damping: 22, mass: 0.35 }
              }
            >
              <span className="website-check-scanning__progress-fill" aria-hidden />
              <span className="website-check-scanning__progress-cap" aria-hidden />
            </motion.div>
          )}
          <span className="website-check-scanning__progress-shimmer" aria-hidden />
        </div>
      </div>

      {isFailed ? (
        <div className="website-check-scanning__complete-cta website-check-scanning__complete-cta--error" role="alert">
          <h2 className="website-check-scanning__complete-compact-title">
            {WEBSITE_CHECK_COPY.scanning.liveFailedTitle}
          </h2>
          <p className="website-check-scanning__complete-compact-body">{activityLine}</p>
          <button type="button" className="website-check-scanning__view-results website-check-scanning__view-results--primary" onClick={onBack}>
            {WEBSITE_CHECK_COPY.scanning.liveRetryLabel}
          </button>
        </div>
      ) : isComplete && isLive ? (
        <div className="website-check-scanning__complete-cta" role="status" aria-live="polite">
          <h2 className="website-check-scanning__complete-compact-title">
            {livePoll.run?.status === "partial"
              ? WEBSITE_CHECK_COPY.scanning.livePartialTitle
              : WEBSITE_CHECK_COPY.scanning.liveCompleteTitle}
          </h2>
          <p className="website-check-scanning__complete-compact-body">
            {WEBSITE_CHECK_COPY.scanning.liveCompleteBody}
          </p>
          {livePoll.run ? (
            <p className="website-check-scanning__live-score-summary" dir="ltr">
              {formatScoreSummary(livePoll.run) ?? `סטטוס: ${livePoll.run.status}`}
            </p>
          ) : null}
          <button
            type="button"
            className="website-check-scanning__view-results website-check-scanning__view-results--primary"
            onClick={onViewResults}
          >
            {WEBSITE_CHECK_COPY.scanning.viewLiveResultsLabel}
          </button>
        </div>
      ) : isComplete && !isLive ? (
        <div className="website-check-scanning__complete-cta" role="status" aria-live="polite">
          <h2 className="website-check-scanning__complete-compact-title">
            {WEBSITE_CHECK_COPY.scanning.completeTitle}
          </h2>
          <p className="website-check-scanning__complete-compact-body">{WEBSITE_CHECK_COPY.scanning.completeBody}</p>
          <button type="button" className="website-check-scanning__view-results website-check-scanning__view-results--primary" onClick={onViewResults}>
            {WEBSITE_CHECK_COPY.scanning.viewResultsLabel}
          </button>
        </div>
      ) : (
        <div className="website-check-scanning__activity website-check-scanning__activity--live" role="status" aria-live="polite">
          <span className="website-check-scanning__activity-kicker">
            {isLive ? WEBSITE_CHECK_COPY.scanning.liveActivityKicker : WEBSITE_CHECK_COPY.scanning.activityKicker}
          </span>
          <p className="website-check-scanning__activity-line">{activityLine}</p>
        </div>
      )}

      <div className="website-check-scanning__actions">
        <button type="button" className="website-check-scanning__back" onClick={onBack}>
          <MdArrowForward className="website-check-scanning__back-icon" aria-hidden />
          {WEBSITE_CHECK_COPY.scanning.backLabel}
        </button>
        {isComplete && !isLive ? (
          <button type="button" className="website-check-scanning__restart" onClick={onBack}>
            <MdRefresh className="website-check-scanning__restart-icon" aria-hidden />
            {WEBSITE_CHECK_COPY.scanning.restartLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}
