import Link from "next/link";
import {
  buildOpportunityListHref,
  type OpportunityClassificationFilter,
  type OpportunitySourceFilter,
  type OpportunityStatusFilter,
} from "@/lib/business/opportunities/list-url";
import {
  OPPORTUNITY_CLASSIFICATION_LABELS,
  OPPORTUNITY_SOURCE_LABELS,
  OPPORTUNITY_STATUS_LABELS,
} from "@/lib/business/opportunities/rules";
import type { OpportunityClassification, OpportunitySource } from "@/types/opportunity";
import styles from "./OpportunityFilters.module.scss";

type OpportunityFiltersProps = {
  status: OpportunityStatusFilter;
  classification: OpportunityClassificationFilter;
  source: OpportunitySourceFilter;
  q: string;
};

const STATUS_TABS: { id: OpportunityStatusFilter; label: string }[] = [
  { id: "all", label: "הכל" },
  { id: "new", label: OPPORTUNITY_STATUS_LABELS.new },
  { id: "researching", label: OPPORTUNITY_STATUS_LABELS.researching },
  { id: "contacted", label: OPPORTUNITY_STATUS_LABELS.contacted },
  { id: "dismissed", label: OPPORTUNITY_STATUS_LABELS.dismissed },
  { id: "converted", label: OPPORTUNITY_STATUS_LABELS.converted },
];

const CLASSIFICATION_TABS: { id: OpportunityClassificationFilter; label: string }[] = [
  { id: "all", label: "הכל" },
  ...(Object.entries(OPPORTUNITY_CLASSIFICATION_LABELS) as [OpportunityClassification, string][]).map(
    ([id, label]) => ({ id, label })
  ),
];

const SOURCE_OPTIONS: { id: OpportunitySourceFilter; label: string }[] = [
  { id: "all", label: "כל המקורות" },
  ...(Object.entries(OPPORTUNITY_SOURCE_LABELS) as [OpportunitySource, string][]).map(
    ([id, label]) => ({ id, label })
  ),
];

function tabHref(
  status: OpportunityStatusFilter,
  classification: OpportunityClassificationFilter,
  source: OpportunitySourceFilter,
  q: string,
  nextStatus: OpportunityStatusFilter
): string {
  return buildOpportunityListHref({
    status: nextStatus,
    classification,
    source,
    q,
    page: 1,
  });
}

export default function OpportunityFilters({
  status,
  classification,
  source,
  q,
}: OpportunityFiltersProps) {
  return (
    <div className={styles.wrapper}>
      <nav className={styles.tabs} aria-label="סינון לפי סטטוס">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.id}
            href={tabHref(status, classification, source, q, tab.id)}
            className={`${styles.tab} ${status === tab.id ? styles.tabActive : ""}`}
            aria-current={status === tab.id ? "page" : undefined}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <nav className={styles.tabs} aria-label="סינון לפי סיווג">
        {CLASSIFICATION_TABS.map((tab) => (
          <Link
            key={tab.id}
            href={buildOpportunityListHref({
              status,
              classification: tab.id,
              source,
              q,
              page: 1,
            })}
            className={`${styles.tab} ${classification === tab.id ? styles.tabActive : ""}`}
            aria-current={classification === tab.id ? "page" : undefined}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className={styles.sourceRow}>
        <span className={styles.sourceLabel}>מקור</span>
        <div className={styles.sourceTabs}>
          {SOURCE_OPTIONS.map((opt) => (
            <Link
              key={opt.id}
              href={buildOpportunityListHref({
                status,
                classification,
                source: opt.id,
                q,
                page: 1,
              })}
              className={`${styles.tab} ${styles.tabSmall} ${source === opt.id ? styles.tabActive : ""}`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      <form
        className={styles.searchForm}
        action="/admin/business/opportunities"
        method="get"
      >
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        {classification !== "all" && (
          <input type="hidden" name="classification" value={classification} />
        )}
        {source !== "all" && <input type="hidden" name="source" value={source} />}
        <label htmlFor="opp-search" className={styles.searchLabel}>
          חיפוש
        </label>
        <input
          id="opp-search"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="כותרת, שם עסק או איש קשר"
          className={styles.searchInput}
          autoComplete="off"
        />
        <button type="submit" className={styles.searchButton}>
          חפש
        </button>
      </form>
    </div>
  );
}
