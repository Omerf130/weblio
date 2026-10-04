import Link from "next/link";
import {
  MdAccessTime,
  MdDateRange,
  MdInbox,
  MdToday,
  MdTrendingUp,
} from "react-icons/md";
import FollowUpStatusBadge from "@/components/admin/business/follow-ups/FollowUpStatusBadge";
import type { BusinessOverviewDashboardData } from "@/types/business";
import type { OpportunitySummary } from "@/types/opportunity";
import styles from "./BusinessOverview.module.scss";

type Props = {
  activity: BusinessOverviewDashboardData["activity"];
  leadSummaries: Map<string, { id: string; leadNumber: number; name: string }>;
  opportunitySummaries: Map<string, OpportunitySummary>;
};

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

const URGENCY_LABEL: Record<
  BusinessOverviewDashboardData["activity"]["followUps"][number]["urgency"],
  string
> = {
  overdue: "באיחור",
  today: "להיום",
  upcoming: "קרוב",
};

const FOLLOW_UP_ICON = {
  overdue: MdAccessTime,
  today: MdToday,
  upcoming: MdDateRange,
} as const;

export default function BusinessOverviewActivityPanel({
  activity,
  leadSummaries,
  opportunitySummaries,
}: Props) {
  const hasFollowUps = activity.followUps.length > 0;
  const hasUnread = activity.unreadLeadCount > 0;
  const hasNewOpps = activity.recentNewOpportunities.length > 0;
  const hasContent = hasFollowUps || hasUnread || hasNewOpps;

  return (
    <section className={styles.panel} aria-labelledby="overview-activity-title">
      <div className={styles.panelHeader}>
        <h2 id="overview-activity-title" className={styles.panelTitle}>
          פעילויות קרובות
        </h2>
        <Link href="/admin/business/follow-ups" className={styles.panelLink}>
          צפייה בהכל
        </Link>
      </div>

      {!hasContent ? (
        <p className={styles.emptyState}>אין פעילויות דחופות כרגע</p>
      ) : (
        <ul className={styles.activityList}>
          {activity.followUps.map((followUp) => {
            const Icon = FOLLOW_UP_ICON[followUp.urgency];
            const entityLink =
              followUp.leadId && leadSummaries.get(followUp.leadId)
                ? {
                    href: `/admin/leads/${followUp.leadId}`,
                    label: `#${leadSummaries.get(followUp.leadId)!.leadNumber} — ${leadSummaries.get(followUp.leadId)!.name}`,
                  }
                : followUp.opportunityId &&
                    opportunitySummaries.get(followUp.opportunityId)
                  ? {
                      href: `/admin/business/opportunities/${followUp.opportunityId}`,
                      label: opportunitySummaries.get(followUp.opportunityId)!.title,
                    }
                  : null;

            return (
              <li
                key={followUp.id}
                className={`${styles.activityRow} ${styles[`activityRow_${followUp.urgency}`]}`}
              >
                <span
                  className={`${styles.activityIcon} ${styles[`activityIcon_${followUp.urgency}`]}`}
                  aria-hidden
                >
                  <Icon />
                </span>
                <div className={styles.activityBody}>
                  <div className={styles.activityTopLine}>
                    <span className={styles.activityUrgency}>{URGENCY_LABEL[followUp.urgency]}</span>
                    <FollowUpStatusBadge status={followUp.status} />
                  </div>
                  <span className={styles.activityTitle}>{followUp.title}</span>
                  <time className={styles.activityTime} dateTime={followUp.dueAt}>
                    {formatDateTime(followUp.dueAt)}
                  </time>
                  {entityLink ? (
                    <Link href={entityLink.href} className={styles.activityEntityLink}>
                      {entityLink.label}
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}

          {hasUnread ? (
            <li className={`${styles.activityRow} ${styles.activityRow_unread}`}>
              <span className={`${styles.activityIcon} ${styles.activityIcon_unread}`} aria-hidden>
                <MdInbox />
              </span>
              <div className={styles.activityBody}>
                <div className={styles.activityTopLine}>
                  <span className={styles.activityUrgency}>לידים</span>
                </div>
                <span className={styles.activityTitle}>
                  {activity.unreadLeadCount} לידים שלא נקראו
                </span>
                <Link href="/admin/leads" className={styles.activityEntityLink}>
                  צפייה בלידים
                </Link>
              </div>
            </li>
          ) : null}

          {activity.recentNewOpportunities.map((opp) => (
            <li key={opp.id} className={`${styles.activityRow} ${styles.activityRow_opp}`}>
              <span className={`${styles.activityIcon} ${styles.activityIcon_opp}`} aria-hidden>
                <MdTrendingUp />
              </span>
              <div className={styles.activityBody}>
                <div className={styles.activityTopLine}>
                  <span className={styles.activityUrgency}>הזדמנות חדשה</span>
                </div>
                <span className={styles.activityTitle}>{opp.title}</span>
                <Link
                  href={`/admin/business/opportunities/${opp.id}`}
                  className={styles.activityEntityLink}
                >
                  פתיחת הזדמנות
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
