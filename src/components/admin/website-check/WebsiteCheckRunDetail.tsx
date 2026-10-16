"use client";

import Link from "next/link";
import type { AdminWebsiteCheckRunDetail } from "@/types/admin-website-check-run";
import WebsiteCheckRunStatusBadge from "./WebsiteCheckRunStatusBadge";
import styles from "./WebsiteCheckRunDetail.module.scss";

type WebsiteCheckRunDetailProps = {
  run: AdminWebsiteCheckRunDetail;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function WebsiteCheckRunDetail({ run }: WebsiteCheckRunDetailProps) {
  const ai = run.aiInsights;
  const hasAiContent =
    ai.recommendations.length > 0 || Boolean(ai.positiveSummary?.trim());

  return (
    <section className={styles.section} dir="rtl">
      <header className={styles.header}>
        <Link href="/admin/website-check" className={styles.backLink}>
          חזרה לבדיקות אתר
        </Link>
        <h1 className={styles.title}>פרטי בדיקה</h1>
        <p className={styles.url}>{run.url}</p>
      </header>

      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>סיכום</h2>
        <div className={styles.metaRow}>
          <span>תאריך: {formatDate(run.analyzedAt)}</span>
          <WebsiteCheckRunStatusBadge status={run.status} label={run.statusLabel} />
          <span>{run.hasLead ? "הוגשה פנייה" : "לא הוגשה פנייה"}</span>
        </div>
        {run.errorSummary ? (
          <p className={styles.errorBox} role="alert">
            {run.errorSummary}
          </p>
        ) : null}
        {run.hasLead && run.leadId ? (
          <p style={{ marginTop: "0.75rem" }}>
            <Link href={`/admin/leads/${run.leadId}`} className={styles.leadButton}>
              צפייה בפנייה
            </Link>
          </p>
        ) : null}
      </div>

      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>ציונים</h2>
        <div className={styles.grid}>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>ציון כללי</span>
            <span className={styles.metricValue}>{run.scoreLabels.overall}</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>ביצועים</span>
            <span className={styles.metricValue}>{run.scoreLabels.performance}</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>SEO</span>
            <span className={styles.metricValue}>{run.scoreLabels.seo}</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>נגישות</span>
            <span className={styles.metricValue}>{run.scoreLabels.accessibility}</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>תקינות האתר</span>
            <span className={styles.metricValue}>{run.scoreLabels.bestPractices}</span>
          </div>
        </div>
      </div>

      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>ממצאים מאומתים</h2>
        {run.findings.length === 0 ? (
          <p className={styles.muted}>אין ממצאים עסקיים להצגה לבדיקה זו.</p>
        ) : (
          <ul className={styles.list}>
            {run.findings.map((finding) => (
              <li key={finding.id} className={styles.listItem}>
                <p className={styles.listItemTitle}>{finding.title}</p>
                <p className={styles.listItemBody}>{finding.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>המלצות AI</h2>
        <p className={styles.muted}>סטטוס: {ai.statusLabel}</p>
        {!hasAiContent ? (
          <p className={styles.muted}>המלצות AI אינן זמינות לבדיקה זו.</p>
        ) : (
          <>
            {ai.positiveSummary ? (
              <p className={styles.listItemBody} style={{ marginBottom: "0.75rem" }}>
                {ai.positiveSummary}
              </p>
            ) : null}
            <ul className={styles.list}>
              {ai.recommendations.map((rec) => (
                <li key={rec.id} className={styles.listItem}>
                  <p className={styles.listItemTitle}>{rec.title}</p>
                  <p className={styles.listItemBody}>{rec.explanation}</p>
                  <p className={styles.listItemBody}>{rec.action}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
