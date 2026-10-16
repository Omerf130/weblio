"use client";

import type { BusinessFindingView } from "@/lib/website-check/business-report";

const PRIORITY_COPY: Record<BusinessFindingView["priorityLabel"], string> = {
  high: "עדיפות גבוהה",
  medium: "עדיפות בינונית",
  low: "עדיפות נמוכה",
};

type WebsiteCheckResultsFindingsProps = {
  heading: string;
  demoNotice?: string | null;
  findings: readonly BusinessFindingView[];
  emptyMessage: string | null;
};

function FindingCard({ finding }: { finding: BusinessFindingView }) {
  return (
    <article
      className={`website-check-results__finding-card website-check-results__finding-card--${finding.priorityLabel}`}
    >
      <span className="website-check-results__finding-card-priority">{PRIORITY_COPY[finding.priorityLabel]}</span>
      <h3 className="website-check-results__finding-card-title">{finding.title}</h3>
      <dl className="website-check-results__finding-card-dl">
        <div>
          <dt>מה מצאנו?</dt>
          <dd>{finding.whatWeFound}</dd>
        </div>
        <div>
          <dt>למה זה חשוב?</dt>
          <dd>{finding.whyItMatters}</dd>
        </div>
        <div>
          <dt>מה כדאי לעשות?</dt>
          <dd>{finding.whatToDo}</dd>
        </div>
      </dl>
    </article>
  );
}

export default function WebsiteCheckResultsFindings({
  heading,
  demoNotice,
  findings,
  emptyMessage,
}: WebsiteCheckResultsFindingsProps) {
  return (
    <section className="website-check-results__findings-block" aria-labelledby="website-check-main-findings-title">
      <h2 id="website-check-main-findings-title" className="website-check-results__block-title">
        {heading}
      </h2>
      {demoNotice ? (
        <p className="website-check-results__demo-note" role="status">
          {demoNotice}
        </p>
      ) : null}
      {findings.length > 0 ? (
        <ol className="website-check-results__finding-cards">
          {findings.map((finding) => (
            <li key={finding.id}>
              <FindingCard finding={finding} />
            </li>
          ))}
        </ol>
      ) : emptyMessage ? (
        <p className="website-check-results__positive-inline" role="status">
          {emptyMessage}
        </p>
      ) : null}
    </section>
  );
}
