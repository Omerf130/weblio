"use client";

import type { PublicWebsiteCheckAiInsights } from "@/types/website-check-ai";
import { isWebsiteCheckAiInsightsInProgress } from "@/lib/website-check/ai-insights-status";

type WebsiteCheckAiRecommendationsProps = {
  heading: string;
  loadingLabel: string;
  demoNotice?: string | null;
  aiInsights?: PublicWebsiteCheckAiInsights;
};

export default function WebsiteCheckAiRecommendations({
  heading,
  loadingLabel,
  demoNotice,
  aiInsights,
}: WebsiteCheckAiRecommendationsProps) {
  if (demoNotice) {
    return (
      <section className="website-check-results__ai-block" aria-labelledby="website-check-ai-heading">
        <h2 id="website-check-ai-heading" className="website-check-results__block-title">
          {heading}
        </h2>
        <p className="website-check-results__demo-note" role="status">
          {demoNotice}
        </p>
      </section>
    );
  }

  const inProgress = isWebsiteCheckAiInsightsInProgress(aiInsights?.status);
  const recommendations = aiInsights?.recommendations ?? [];
  const positiveSummary = aiInsights?.positiveSummary?.trim();

  return (
    <section className="website-check-results__ai-block" aria-labelledby="website-check-ai-heading">
      <h2 id="website-check-ai-heading" className="website-check-results__block-title">
        {heading}
      </h2>

      {inProgress ? (
        <p className="website-check-results__ai-loading" role="status" aria-live="polite">
          {loadingLabel}
        </p>
      ) : null}

      {!inProgress && recommendations.length > 0 ? (
        <ol className="website-check-results__ai-list">
          {recommendations.map((item) => (
            <li key={item.id}>
              <article className="website-check-results__ai-card">
                <h3 className="website-check-results__ai-card-title">{item.title}</h3>
                <p className="website-check-results__ai-card-body">{item.explanation}</p>
                {item.optionalMetric ? (
                  <p className="website-check-results__ai-metric">מדידה: {item.optionalMetric}</p>
                ) : null}
                <p className="website-check-results__ai-action">
                  <strong>צעד מומלץ: </strong>
                  {item.action}
                </p>
              </article>
            </li>
          ))}
        </ol>
      ) : null}

      {!inProgress && recommendations.length === 0 && positiveSummary ? (
        <p className="website-check-results__positive-inline" role="status">
          {positiveSummary}
        </p>
      ) : null}
    </section>
  );
}
