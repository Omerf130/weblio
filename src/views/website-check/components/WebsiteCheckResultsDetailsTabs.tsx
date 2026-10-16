"use client";

import { useCallback, useId, useRef, useState, type KeyboardEvent } from "react";
import type {
  WebsiteCheckFinding,
  WebsiteCheckRecommendation,
  WebsiteCheckResultsCopy,
} from "../website-check-results-content";

export type DetailsTabId = "findings" | "recommendations";

const TAB_ORDER: DetailsTabId[] = ["findings", "recommendations"];

type WebsiteCheckResultsDetailsTabsProps = {
  sectionId?: string;
  copy: WebsiteCheckResultsCopy;
  findings: readonly WebsiteCheckFinding[];
  recommendations: readonly WebsiteCheckRecommendation[];
};

export default function WebsiteCheckResultsDetailsTabs({
  sectionId = "website-check-results-details",
  copy,
  findings,
  recommendations,
}: WebsiteCheckResultsDetailsTabsProps) {
  const baseId = useId();
  const [activeTab, setActiveTab] = useState<DetailsTabId>("findings");
  const tabRefs = useRef<Partial<Record<DetailsTabId, HTMLButtonElement | null>>>({});

  const focusTab = useCallback((tabId: DetailsTabId) => {
    tabRefs.current[tabId]?.focus();
  }, []);

  const activateTab = useCallback(
    (tabId: DetailsTabId) => {
      setActiveTab(tabId);
      focusTab(tabId);
    },
    [focusTab],
  );

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, tabId: DetailsTabId) => {
    const index = TAB_ORDER.indexOf(tabId);
    if (index === -1) return;

    let nextIndex = index;

    if (event.key === "ArrowLeft") {
      nextIndex = (index + 1) % TAB_ORDER.length;
      event.preventDefault();
    } else if (event.key === "ArrowRight") {
      nextIndex = (index - 1 + TAB_ORDER.length) % TAB_ORDER.length;
      event.preventDefault();
    } else if (event.key === "Home") {
      nextIndex = 0;
      event.preventDefault();
    } else if (event.key === "End") {
      nextIndex = TAB_ORDER.length - 1;
      event.preventDefault();
    } else {
      return;
    }

    activateTab(TAB_ORDER[nextIndex]);
  };

  const findingsPanelId = `${baseId}-panel-findings`;
  const recommendationsPanelId = `${baseId}-panel-recommendations`;
  const findingsTabId = `${baseId}-tab-findings`;
  const recommendationsTabId = `${baseId}-tab-recommendations`;

  return (
    <section
      id={sectionId}
      className="website-check-results__details"
      aria-labelledby={`${baseId}-details-heading`}
    >
      <h2 id={`${baseId}-details-heading`} className="website-check-results__details-heading">
        {copy.detailsSectionHeading}
      </h2>

      <div className="website-check-results__tabs">
        <div
          className="website-check-results__tablist"
          role="tablist"
          aria-label={copy.detailsTabsAriaLabel}
        >
          <button
            ref={(node) => {
              tabRefs.current.findings = node;
            }}
            type="button"
            role="tab"
            id={findingsTabId}
            className={`website-check-results__tab ${activeTab === "findings" ? "website-check-results__tab--active" : ""}`}
            aria-selected={activeTab === "findings"}
            aria-controls={findingsPanelId}
            tabIndex={activeTab === "findings" ? 0 : -1}
            onClick={() => setActiveTab("findings")}
            onKeyDown={(event) => handleTabKeyDown(event, "findings")}
          >
            {copy.tabFindingsLabel}
          </button>
          <button
            ref={(node) => {
              tabRefs.current.recommendations = node;
            }}
            type="button"
            role="tab"
            id={recommendationsTabId}
            className={`website-check-results__tab ${activeTab === "recommendations" ? "website-check-results__tab--active" : ""}`}
            aria-selected={activeTab === "recommendations"}
            aria-controls={recommendationsPanelId}
            tabIndex={activeTab === "recommendations" ? 0 : -1}
            onClick={() => setActiveTab("recommendations")}
            onKeyDown={(event) => handleTabKeyDown(event, "recommendations")}
          >
            {copy.tabRecommendationsLabel}
          </button>
        </div>

        <div
          role="tabpanel"
          id={findingsPanelId}
          className="website-check-results__tabpanel website-check-results__tabpanel--findings"
          aria-labelledby={findingsTabId}
          hidden={activeTab !== "findings"}
        >
          <p className="website-check-results__panel-intro">{copy.findingsIntro}</p>
          {findings.length === 0 ? (
            <p className="website-check-results__empty-panel" role="status">
              {copy.findingsEmptyMessage}
            </p>
          ) : (
            <ul className="website-check-results__finding-list">
              {findings.map((finding) => (
                <li key={finding.id}>
                  <details className={`website-check-results__finding website-check-results__finding--${finding.status}`}>
                    <summary className="website-check-results__finding-summary">
                      <span className="website-check-results__finding-dot" aria-hidden />
                      <span className="website-check-results__finding-status">
                        {copy.findingStatusLabels[finding.status]}
                      </span>
                      <span className="website-check-results__finding-title" dir="auto" lang="en">
                        {finding.title}
                      </span>
                      <span className="website-check-results__finding-teaser" dir="auto">
                        {finding.summary}
                      </span>
                    </summary>
                    <p className="website-check-results__finding-details" dir="auto">
                      {finding.details}
                    </p>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          role="tabpanel"
          id={recommendationsPanelId}
          className="website-check-results__tabpanel website-check-results__tabpanel--recommendations"
          aria-labelledby={recommendationsTabId}
          hidden={activeTab !== "recommendations"}
        >
          <p className="website-check-results__panel-intro">{copy.recommendationsIntro}</p>
          {recommendations.length === 0 ? (
            <p className="website-check-results__empty-panel" role="status">
              {copy.recommendationsEmptyMessage}
            </p>
          ) : (
            <ol className="website-check-results__recommendation-list">
              {recommendations.map((item, index) => (
                <li key={item.id}>
                  <details className={`website-check-results__recommendation website-check-results__recommendation--${item.priority}`}>
                    <summary className="website-check-results__recommendation-summary">
                      <span className="website-check-results__recommendation-index" aria-hidden>
                        {index + 1}
                      </span>
                      <span className="website-check-results__recommendation-priority">
                        {copy.priorityLabels[item.priority]}
                      </span>
                      <span className="website-check-results__recommendation-title" dir="auto" lang="en">
                        {item.title}
                      </span>
                      <span className="website-check-results__recommendation-teaser" dir="auto">
                        {item.summary}
                      </span>
                    </summary>
                    <p className="website-check-results__recommendation-details" dir="auto">
                      {item.details}
                    </p>
                  </details>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
