import Link from "next/link";
import {
  buildIntentListHref,
  type IntentClassificationFilter,
  type IntentProviderFilter,
  type IntentStatusFilter,
} from "@/lib/business/intents/list-url";
import { INTENT_CLASSIFICATION_LABELS } from "@/lib/business/intents/classification-rules";
import { formatIntentProviderLabel } from "@/lib/business/intents/rules";
import styles from "./IntentFilters.module.scss";

type IntentFiltersProps = {
  status: IntentStatusFilter;
  classification: IntentClassificationFilter;
  provider: IntentProviderFilter;
  q: string;
  providers: string[];
};

const STATUS_TABS: { id: IntentStatusFilter; label: string }[] = [
  { id: "new", label: "חדשים" },
  { id: "dismissed", label: "נדחו" },
  { id: "all", label: "הכל" },
];

const CLASSIFICATION_TABS: { id: IntentClassificationFilter; label: string }[] = [
  { id: "inbox", label: "רלוונטי לסקירה" },
  { id: "unclassified", label: INTENT_CLASSIFICATION_LABELS.unclassified },
  { id: "explicitNeed", label: INTENT_CLASSIFICATION_LABELS.explicitNeed },
  { id: "possibleNeed", label: INTENT_CLASSIFICATION_LABELS.possibleNeed },
  { id: "irrelevant", label: INTENT_CLASSIFICATION_LABELS.irrelevant },
  { id: "all", label: "כל הסיווגים" },
];

function filterHref(
  status: IntentStatusFilter,
  classification: IntentClassificationFilter,
  provider: IntentProviderFilter,
  q: string,
  patch: Partial<{
    status: IntentStatusFilter;
    classification: IntentClassificationFilter;
    provider: IntentProviderFilter;
  }>
): string {
  return buildIntentListHref({
    status: patch.status ?? status,
    classification: patch.classification ?? classification,
    provider: patch.provider ?? provider,
    q,
    page: 1,
  });
}

export default function IntentFilters({
  status,
  classification,
  provider,
  q,
  providers,
}: IntentFiltersProps) {
  const providerOptions: IntentProviderFilter[] = [
    "all",
    ...providers.filter((p) => p !== "all"),
  ];

  return (
    <div className={styles.wrapper}>
      <nav className={styles.tabs} aria-label="סינון לפי סטטוס">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.id}
            href={filterHref(status, classification, provider, q, { status: tab.id })}
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
            href={filterHref(status, classification, provider, q, {
              classification: tab.id,
            })}
            className={`${styles.tab} ${classification === tab.id ? styles.tabActive : ""}`}
            aria-current={classification === tab.id ? "page" : undefined}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {providerOptions.length > 1 && (
        <div className={styles.sourceRow}>
          <span className={styles.sourceLabel}>ספק</span>
          <div className={styles.sourceTabs}>
            {providerOptions.map((opt) => (
              <Link
                key={opt}
                href={filterHref(status, classification, provider, q, { provider: opt })}
                className={`${styles.tab} ${styles.tabSmall} ${provider === opt ? styles.tabActive : ""}`}
              >
                {opt === "all" ? "כל הספקים" : formatIntentProviderLabel(opt)}
              </Link>
            ))}
          </div>
        </div>
      )}

      <form className={styles.searchForm} action="/admin/business/intent" method="get">
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        {classification !== "all" && (
          <input type="hidden" name="classification" value={classification} />
        )}
        {provider !== "all" && <input type="hidden" name="provider" value={provider} />}
        <label htmlFor="intent-search" className={styles.searchLabel}>
          חיפוש
        </label>
        <input
          id="intent-search"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="כותרת או תוכן"
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
