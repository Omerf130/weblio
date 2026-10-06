import Link from "next/link";
import { formatIsraelDateTime } from "@/lib/admin/dashboard-time";
import { estimateTavilyCreditsForRun } from "@/lib/discovery/discovery-run-credits";
import type { BusinessOverviewDashboardData } from "@/types/business";
import type { DiscoveryRunStatus } from "@/types/discovery-run";
import styles from "./BusinessOverview.module.scss";

type Props = {
  discovery: BusinessOverviewDashboardData["discovery"];
};

const RUN_STATUS_LABELS: Record<DiscoveryRunStatus, string> = {
  running: "רץ",
  completed: "הושלם",
  partial: "חלקי",
  failed: "נכשל",
  skipped: "דולג",
};

function healthTone(
  state: BusinessOverviewDashboardData["discovery"]["automationHealth"]["state"]
): string {
  switch (state) {
    case "healthy":
      return styles.healthOk;
    case "running":
      return styles.healthInfo;
    case "partial":
    case "not_run_today":
      return styles.healthWarn;
    case "failed":
    case "credit_stopped":
      return styles.healthBad;
    default:
      return styles.healthMuted;
  }
}

function creditBarTone(credits: Props["discovery"]["monthlyCredits"]): string {
  if (credits.hardStopReached) {
    return styles.creditBarHard;
  }
  if (credits.softWarnReached) {
    return styles.creditBarWarn;
  }
  return styles.creditBarNormal;
}

export default function BusinessOverviewDiscoveryPanel({ discovery }: Props) {
  const { automationHealth, latestRun, monthlyCredits, cronDiagnostics } = discovery;
  const creditPercent = Math.min(
    100,
    monthlyCredits.hardStopLimit > 0
      ? Math.round(
          (monthlyCredits.estimatedCreditsUsed / monthlyCredits.hardStopLimit) * 100
        )
      : 0
  );

  const summary = latestRun?.summary;
  const runCredits = latestRun
    ? estimateTavilyCreditsForRun({
        estimatedTavilyCredits: summary?.estimatedTavilyCredits,
        tavilyHttpAttempts: summary?.tavilyHttpAttempts,
        tavilyRequests: summary?.tavilyRequests,
      })
    : 0;

  const profileSummaries = latestRun?.profileSummaries;
  const explicitNeed = profileSummaries
    ? profileSummaries.reduce((sum, row) => sum + row.explicitNeed, 0)
    : undefined;

  const possibleNeed = profileSummaries
    ? profileSummaries.reduce((sum, row) => sum + row.possibleNeed, 0)
    : undefined;

  const classifiedTotal =
    explicitNeed !== undefined && possibleNeed !== undefined
      ? explicitNeed + possibleNeed
      : (summary?.classified ?? 0);

  return (
    <section className={styles.panel} aria-labelledby="overview-discovery-title">
      <div className={styles.panelHeader}>
        <h2 id="overview-discovery-title" className={styles.panelTitle}>
          Discovery
        </h2>
        <Link href="/admin/business/intent" className={styles.panelLink}>
          למוניטור הכוונות
        </Link>
      </div>

      <div className={styles.discoveryHealthRow}>
        <span className={styles.discoveryHealthLabel}>אוטומציית Discovery</span>
        <span
          className={`${styles.discoveryHealthBadge} ${healthTone(automationHealth.state)}`}
        >
          {automationHealth.label}
        </span>
      </div>

      <div className={styles.discoveryCreditBlock}>
        <div className={styles.discoveryCreditHeader}>
          <span className={styles.discoveryCreditTitle}>שימוש Discovery החודש</span>
          <span className={styles.discoveryCreditValues}>
            {monthlyCredits.estimatedCreditsUsed} מתוך {monthlyCredits.hardStopLimit} קרדיטים
          </span>
        </div>
        <div
          className={styles.creditBarTrack}
          role="progressbar"
          aria-valuenow={monthlyCredits.estimatedCreditsUsed}
          aria-valuemin={0}
          aria-valuemax={monthlyCredits.hardStopLimit}
          aria-label="שימוש קרדיטים חודשי"
        >
          <span
            className={`${styles.creditBarFill} ${creditBarTone(monthlyCredits)}`}
            style={{ width: `${creditPercent}%` }}
          />
        </div>
      </div>

      <div className={styles.discoveryCronDiagnosticsBlock}>
        <h3 className={styles.discoveryRunTitle}>אבחון Cron (Discovery)</h3>
        {!cronDiagnostics.lastAttempt ? (
          <p className={styles.emptyStateInline}>{cronDiagnostics.reachedServerLabel}</p>
        ) : (
          <dl className={styles.discoveryCronDiagnosticsList}>
            <div>
              <dt>הגעה לשרת</dt>
              <dd>{cronDiagnostics.reachedServerLabel}</dd>
            </div>
            <div>
              <dt>קריאה אחרונה</dt>
              <dd>
                <time dateTime={cronDiagnostics.lastAttempt.invokedAt}>
                  {formatIsraelDateTime(cronDiagnostics.lastAttempt.invokedAt)}
                </time>
              </dd>
            </div>
            <div>
              <dt>תוצאה</dt>
              <dd>{cronDiagnostics.lastAttemptLabel}</dd>
            </div>
            {cronDiagnostics.lastAttempt.vercelCronSchedule ? (
              <div>
                <dt>לוח זמנים (UTC)</dt>
                <dd>
                  <code className={styles.discoveryCronScheduleCode}>
                    {cronDiagnostics.lastAttempt.vercelCronSchedule}
                  </code>
                </dd>
              </div>
            ) : null}
          </dl>
        )}
      </div>

      <div className={styles.discoveryRunBlock}>
        <h3 className={styles.discoveryRunTitle}>הרצת Discovery אחרונה</h3>
        {!latestRun ? (
          <p className={styles.emptyStateInline}>עדיין לא קיימת הרצת Discovery</p>
        ) : (
          <>
            <div className={styles.discoveryRunMeta}>
              <span>
                {latestRun.triggerKind === "scheduled" ? "מתוזמן" : "ידני"}
              </span>
              <span
                className={`${styles.runStatusBadge} ${styles[`runStatus_${latestRun.status}`] ?? ""}`}
              >
                {RUN_STATUS_LABELS[latestRun.status]}
              </span>
              {latestRun.completedAt ? (
                <time dateTime={latestRun.completedAt}>
                  {formatIsraelDateTime(latestRun.completedAt)}
                </time>
              ) : null}
            </div>
            <dl className={styles.discoveryMetrics}>
              <div>
                <dt>כוונות שנוצרו</dt>
                <dd>{summary?.created ?? 0}</dd>
              </div>
              <div>
                <dt>רלוונטיות (מפורש + אפשרי)</dt>
                <dd>{classifiedTotal}</dd>
              </div>
              <div>
                <dt>קרדיטים משוערים</dt>
                <dd>{runCredits}</dd>
              </div>
              <div>
                <dt>פרופילים</dt>
                <dd>
                  {summary?.profilesSearched ?? 0}/{summary?.profilesSelected ?? 0}
                </dd>
              </div>
            </dl>
          </>
        )}
      </div>
    </section>
  );
}
