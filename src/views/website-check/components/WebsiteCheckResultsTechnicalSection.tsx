"use client";

import type { WebsiteCheckResultsMetaLine } from "@/lib/website-check/results-view-model";
import type {
  WebsiteCheckFinding,
  WebsiteCheckRecommendation,
  WebsiteCheckResultsCopy,
} from "../website-check-results-content";
import WebsiteCheckLighthouseRichText from "./WebsiteCheckLighthouseRichText";

export type WebsiteCheckFindingGroup = {
  category: WebsiteCheckFinding["category"];
  label: string;
  findings: readonly WebsiteCheckFinding[];
};

type WebsiteCheckResultsTechnicalSectionProps = {
  copy: WebsiteCheckResultsCopy;
  findingGroups: readonly WebsiteCheckFindingGroup[];
  recommendations: readonly WebsiteCheckRecommendation[];
  metaLines: readonly WebsiteCheckResultsMetaLine[];
};

function TechnicalFindingRow({ finding, copy }: { finding: WebsiteCheckFinding; copy: WebsiteCheckResultsCopy }) {
  return (
    <details className="website-check-results__tech-row">
      <summary className="website-check-results__tech-row-summary">
        <span className="website-check-results__tech-row-title" dir="auto" lang="en">
          {finding.title}
        </span>
      </summary>
      <WebsiteCheckLighthouseRichText
        text={finding.details}
        className="website-check-results__tech-row-body"
        learnMoreLabel={copy.learnMoreLabel}
        documentationUrl={finding.documentationUrl}
      />
    </details>
  );
}

export default function WebsiteCheckResultsTechnicalSection({
  copy,
  findingGroups,
  recommendations,
  metaLines,
}: WebsiteCheckResultsTechnicalSectionProps) {
  const findingCount = findingGroups.reduce((sum, group) => sum + group.findings.length, 0);

  return (
    <section className="website-check-results__technical-wrap" aria-label={copy.technicalDetailsHeading}>
      <details className="website-check-results__technical-collapse website-check-results__technical-collapse--compact">
        <summary className="website-check-results__collapse-summary website-check-results__collapse-summary--compact">
          {copy.technicalDetailsHeading}
          <span className="website-check-results__technical-badge" dir="ltr">
            {findingCount} / {recommendations.length}
          </span>
        </summary>
        <div className="website-check-results__technical-inner">
          {copy.transparencyBody ? <p className="website-check-results__technical-note">{copy.transparencyBody}</p> : null}
          {metaLines.length > 0 ? (
            <dl className="website-check-results__meta website-check-results__meta--compact">
              {metaLines.map((line) => (
                <div key={line.id} className="website-check-results__meta-row">
                  <dt>{line.label}</dt>
                  <dd dir={line.id === "lighthouse" ? "ltr" : undefined}>{line.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {findingGroups.map((group) =>
            group.findings.length === 0 ? null : (
              <div key={group.category ?? group.label} className="website-check-results__tech-group">
                <h3 className="website-check-results__tech-group-title">{group.label}</h3>
                <div className="website-check-results__tech-group-list">
                  {group.findings.map((finding) => (
                    <TechnicalFindingRow key={finding.id} finding={finding} copy={copy} />
                  ))}
                </div>
              </div>
            )
          )}
          {recommendations.length > 0 ? (
            <div className="website-check-results__tech-recs">
              <h3 className="website-check-results__tech-group-title">{copy.recommendationsSectionHeading}</h3>
              <ul className="website-check-results__tech-rec-list">
                {recommendations.map((item) => (
                  <li key={item.id}>
                    <span className="website-check-results__tech-rec-title" dir="auto" lang="en">
                      {item.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </details>
    </section>
  );
}
