"use client";

import Link from "next/link";
import type {
  AdminWebsiteCheckRunListItem,
  AdminWebsiteCheckRunSummary,
} from "@/types/admin-website-check-run";
import type {
  AdminWebsiteCheckLeadFilter,
  AdminWebsiteCheckStatusFilter,
} from "@/lib/admin/website-check/list-query";
import { buildAdminWebsiteCheckListHref } from "@/lib/admin/website-check/list-url";
import WebsiteCheckRunStatusBadge from "./WebsiteCheckRunStatusBadge";
import styles from "./WebsiteCheckRunsManager.module.scss";

type WebsiteCheckRunsManagerProps = {
  summary: AdminWebsiteCheckRunSummary;
  items: AdminWebsiteCheckRunListItem[];
  status: AdminWebsiteCheckStatusFilter;
  hasLead: AdminWebsiteCheckLeadFilter;
  q: string;
  pagination: {
    page: number;
    totalPages: number;
    totalItems: number;
  };
  errorMessage?: string;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function scoreClass(display: string, score: number | null): string {
  if (display === "נכשל" || display === "בבדיקה" || display === "לא זמין") {
    return styles.scoreMuted;
  }
  if (score === null) return styles.scoreMuted;
  if (score >= 80) return styles.scoreGood;
  if (score >= 50) return styles.scoreMid;
  return styles.scoreLow;
}

function RunRowActions({ id }: { id: string }) {
  return (
    <Link href={`/admin/website-check/${id}`} className={styles.linkButton}>
      פרטים
    </Link>
  );
}

export default function WebsiteCheckRunsManager({
  summary,
  items,
  status,
  hasLead,
  q,
  pagination,
  errorMessage,
}: WebsiteCheckRunsManagerProps) {
  const listBase = { status, hasLead, q };
  const hasFilters = status !== "all" || hasLead !== "all" || q.length > 0;

  return (
    <div className={styles.page} dir="rtl">
      <header className={styles.header}>
        <h1 className={styles.heading}>בדיקות אתר</h1>
        <p className={styles.subtitle}>
          מעקב אחר אתרים שנבדקו באמצעות הכלי באתר
        </p>
        <p className={styles.summaryNote}>
          הספירה מתייחסת לריצות ניתוח שנשמרו במערכת, ולא לכל כניסה לעמוד או
          לתצוגת תוצאות מהמטמון ללא ריצה חדשה.
        </p>
      </header>

      {errorMessage ? (
        <p className={styles.alert} role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className={styles.summaryGrid} aria-label="סיכום בדיקות">
        <article className={styles.summaryCard}>
          <p className={styles.summaryValue}>{summary.totalRuns.toLocaleString("he-IL")}</p>
          <p className={styles.summaryLabel}>סה&quot;כ בדיקות</p>
        </article>
        <article className={styles.summaryCard}>
          <p className={styles.summaryValue}>
            {summary.uniqueWebsites.toLocaleString("he-IL")}
          </p>
          <p className={styles.summaryLabel}>אתרים ייחודיים</p>
        </article>
        <article className={styles.summaryCard}>
          <p className={styles.summaryValue}>
            {summary.leadsSubmitted.toLocaleString("he-IL")}
          </p>
          <p className={styles.summaryLabel}>פניות שהתקבלו</p>
        </article>
      </div>

      <form className={styles.filters} method="get">
        <div className={styles.filterRow}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="wc-status">
              סטטוס
            </label>
            <select
              id="wc-status"
              name="status"
              className={styles.select}
              defaultValue={status}
            >
              <option value="all">הכל</option>
              <option value="completed">הושלם</option>
              <option value="partial">הושלם חלקית</option>
              <option value="failed">נכשל</option>
              <option value="in_progress">בבדיקה</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="wc-lead">
              השאיר פרטים
            </label>
            <select
              id="wc-lead"
              name="hasLead"
              className={styles.select}
              defaultValue={hasLead}
            >
              <option value="all">הכל</option>
              <option value="yes">כן</option>
              <option value="no">לא</option>
            </select>
          </div>
        </div>
        <div className={styles.searchRow}>
          <div className={styles.field} style={{ flex: 2 }}>
            <label className={styles.fieldLabel} htmlFor="wc-q">
              חיפוש כתובת
            </label>
            <input
              id="wc-q"
              name="q"
              type="search"
              className={styles.input}
              placeholder="דומיין או URL"
              defaultValue={q}
              dir="ltr"
            />
          </div>
          <button type="submit" className={styles.searchButton}>
            סינון
          </button>
        </div>
      </form>

      {items.length === 0 ? (
        <p className={styles.empty}>
          {hasFilters
            ? "לא נמצאו בדיקות לפי הסינון הנוכחי."
            : "עדיין אין בדיקות שנשמרו. בדיקות חדשות יופיעו כאן לאחר ריצות מהאתר הציבורי."}
        </p>
      ) : (
        <>
          <div className={`${styles.tableWrap} ${styles.desktopTable}`}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>אתר שנבדק</th>
                  <th>ציון כללי</th>
                  <th>תאריך הבדיקה</th>
                  <th>סטטוס</th>
                  <th>השאיר פרטים</th>
                  <th>פעולה</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className={styles.urlCell}>{item.url}</td>
                    <td
                      className={`${styles.scoreCell} ${scoreClass(item.overallDisplay, item.overallScore)}`}
                    >
                      {item.overallDisplay}
                    </td>
                    <td>{formatDate(item.analyzedAt)}</td>
                    <td>
                      <WebsiteCheckRunStatusBadge status={item.status} label={item.statusLabel} />
                    </td>
                    <td className={item.hasLead ? styles.leadYes : styles.leadNo}>
                      {item.hasLead ? "כן" : "לא"}
                    </td>
                    <td>
                      <RunRowActions id={item.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.mobileCards}>
            {items.map((item) => (
              <article key={item.id} className={styles.mobileCard}>
                <p className={styles.urlCell}>{item.url}</p>
                <p>
                  ציון:{" "}
                  <span className={scoreClass(item.overallDisplay, item.overallScore)}>
                    {item.overallDisplay}
                  </span>
                </p>
                <p>{formatDate(item.analyzedAt)}</p>
                <WebsiteCheckRunStatusBadge status={item.status} label={item.statusLabel} />
                <p>{item.hasLead ? "השאיר פרטים: כן" : "השאיר פרטים: לא"}</p>
                <RunRowActions id={item.id} />
              </article>
            ))}
          </div>
        </>
      )}

      {pagination.totalPages > 1 ? (
        <nav className={styles.pagination} aria-label="ניווט דפים">
          {pagination.page > 1 ? (
            <Link
              href={buildAdminWebsiteCheckListHref({
                ...listBase,
                page: pagination.page - 1,
              })}
              className={styles.pageLink}
            >
              הקודם
            </Link>
          ) : null}
          <span>
            עמוד {pagination.page} מתוך {pagination.totalPages}
          </span>
          {pagination.page < pagination.totalPages ? (
            <Link
              href={buildAdminWebsiteCheckListHref({
                ...listBase,
                page: pagination.page + 1,
              })}
              className={styles.pageLink}
            >
              הבא
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
