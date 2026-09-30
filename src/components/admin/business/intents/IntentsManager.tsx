"use client";

import Link from "next/link";
import type { AdminIntentListItemDto } from "@/types/intent";
import { buildIntentListHref } from "@/lib/business/intents/list-url";
import type {
  IntentClassificationFilter,
  IntentProviderFilter,
  IntentStatusFilter,
} from "@/lib/business/intents/list-url";
import type { LastDiscoveryRunHint } from "@/lib/business/discovery/discovery-run-messages";
import IntentDiscoveryControl from "./IntentDiscoveryControl";
import IntentFilters from "./IntentFilters";
import IntentItem from "./IntentItem";
import styles from "./IntentsManager.module.scss";

type IntentsManagerProps = {
  intents: AdminIntentListItemDto[];
  status: IntentStatusFilter;
  classification: IntentClassificationFilter;
  provider: IntentProviderFilter;
  q: string;
  providers: string[];
  pagination: {
    page: number;
    totalPages: number;
    totalItems: number;
  };
  hasActiveFilters: boolean;
  lastDiscoveryRun?: LastDiscoveryRunHint | null;
};

export default function IntentsManager({
  intents,
  status,
  classification,
  provider,
  q,
  providers,
  pagination,
  hasActiveFilters,
  lastDiscoveryRun,
}: IntentsManagerProps) {
  const listHrefBase = { status, classification, provider, q };

  return (
    <div className={styles.page} dir="rtl">
      <header className={styles.header}>
        <div>
          <h1 className={styles.heading}>ניטור כוונות</h1>
          <p className={styles.subtitle}>
            כאן מופיעות הזדמנויות אפשריות שזוהו ממקורות חיצוניים. בדוק את התוכן, סווג
            אותו והחלט אם הוא רלוונטי להמשך. (כרגע נתוני פיתוח מ-seed.)
          </p>
          <p className={styles.count}>
            {pagination.totalItems === 0
              ? "אין רשומות"
              : `${pagination.totalItems} רשומות`}
          </p>
        </div>
      </header>

      <IntentDiscoveryControl lastRun={lastDiscoveryRun} />

      <IntentFilters
        status={status}
        classification={classification}
        provider={provider}
        q={q}
        providers={providers}
      />

      {intents.length === 0 ? (
        <p className={styles.empty}>
          {hasActiveFilters
            ? "לא נמצאו רשומות לפי הסינון הנוכחי."
            : "אין רשומות חדשות לסקירה."}
        </p>
      ) : (
        <ul className={styles.list}>
          {intents.map((intent) => (
            <IntentItem key={intent.id} intent={intent} />
          ))}
        </ul>
      )}

      {pagination.totalPages > 1 && (
        <nav className={styles.pagination} aria-label="ניווט דפים">
          {pagination.page > 1 ? (
            <Link
              href={buildIntentListHref({
                ...listHrefBase,
                page: pagination.page - 1,
              })}
              className={styles.pageLink}
            >
              הקודם
            </Link>
          ) : (
            <span className={styles.pageLinkDisabled}>הקודם</span>
          )}

          <span className={styles.pageInfo}>
            עמוד {pagination.page} מתוך {pagination.totalPages}
          </span>

          {pagination.page < pagination.totalPages ? (
            <Link
              href={buildIntentListHref({
                ...listHrefBase,
                page: pagination.page + 1,
              })}
              className={styles.pageLink}
            >
              הבא
            </Link>
          ) : (
            <span className={styles.pageLinkDisabled}>הבא</span>
          )}
        </nav>
      )}
    </div>
  );
}
