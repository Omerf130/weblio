import Link from "next/link";
import { getBusinessOverviewData } from "@/lib/business/overview-data";
import { getLeadSummaries } from "@/lib/data/leads";
import { getOpportunitySummaries } from "@/lib/data/opportunities";
import type { OpportunitySummary } from "@/types/opportunity";
import type { AdminFollowUpDto } from "@/types/follow-up";
import FollowUpStatusBadge from "@/components/admin/business/follow-ups/FollowUpStatusBadge";
import styles from "./business.module.scss";

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default async function BusinessOverviewPage() {
  const data = await getBusinessOverviewData();

  const allFollowUps = [
    ...data.overdueFollowUps,
    ...data.followUpsDueToday,
    ...data.upcomingFollowUps,
  ];
  const leadIds = allFollowUps
    .map((fu) => fu.leadId)
    .filter((id): id is string => !!id);
  const opportunityIds = allFollowUps
    .map((fu) => fu.opportunityId)
    .filter((id): id is string => !!id);

  const [leadSummariesMap, opportunitySummariesMap] = await Promise.all([
    leadIds.length > 0
      ? getLeadSummaries([...new Set(leadIds)])
      : Promise.resolve(new Map()),
    opportunityIds.length > 0
      ? getOpportunitySummaries([...new Set(opportunityIds)])
      : Promise.resolve(new Map()),
  ]);

  const hasAttention =
    data.overdueFollowUps.length > 0 ||
    data.followUpsDueToday.length > 0 ||
    data.unreadLeadCount > 0 ||
    data.newOpportunitiesCount > 0;

  return (
    <div className={styles.page} dir="rtl">
      <header className={styles.header}>
        <h1 className={styles.heading}>סקירה עסקית</h1>
        <p className={styles.subtitle}>מה דורש תשומת לב היום</p>
      </header>

      <div className={styles.grid}>
        <Link
          href="/admin/business/follow-ups?filter=overdue"
          className={`${styles.card} ${data.overdueFollowUps.length > 0 ? styles.cardAlert : ""}`}
        >
          <span className={styles.cardValue}>{data.overdueFollowUps.length}</span>
          <span className={styles.cardLabel}>מעקבים באיחור</span>
        </Link>
        <Link
          href="/admin/business/follow-ups?filter=today"
          className={styles.card}
        >
          <span className={styles.cardValue}>{data.followUpsDueToday.length}</span>
          <span className={styles.cardLabel}>מעקבים להיום</span>
        </Link>
        <Link
          href="/admin/business/follow-ups?filter=upcoming"
          className={styles.card}
        >
          <span className={styles.cardValue}>{data.upcomingFollowUps.length}</span>
          <span className={styles.cardLabel}>מעקבים קרובים</span>
        </Link>
        <Link href="/admin/leads" className={styles.card}>
          <span className={styles.cardValue}>{data.unreadLeadCount}</span>
          <span className={styles.cardLabel}>לידים שלא נקראו</span>
        </Link>
        <Link href="/admin/leads" className={styles.card}>
          <span className={styles.cardValue}>{data.newLeadsLast7Days}</span>
          <span className={styles.cardLabel}>לידים חדשים (7 ימים)</span>
        </Link>
        <Link
          href="/admin/business/intent"
          className={`${styles.card} ${data.actionableIntentsCount > 0 ? styles.cardHighlight : ""}`}
        >
          <span className={styles.cardValue}>{data.actionableIntentsCount}</span>
          <span className={styles.cardLabel}>כוונות לסקירה</span>
        </Link>
        <Link
          href="/admin/business/opportunities?status=new"
          className={`${styles.card} ${data.newOpportunitiesCount > 0 ? styles.cardHighlight : ""}`}
        >
          <span className={styles.cardValue}>{data.newOpportunitiesCount}</span>
          <span className={styles.cardLabel}>הזדמנויות חדשות</span>
        </Link>
        <Link href="/admin/business/opportunities" className={styles.card}>
          <span className={styles.cardValue}>{data.activeOpportunitiesCount}</span>
          <span className={styles.cardLabel}>הזדמנויות פעילות</span>
        </Link>
      </div>

      <section className={styles.attentionSection}>
        <h2 className={styles.sectionTitle}>מה דורש תשומת לב היום</h2>

        {!hasAttention ? (
          <p className={styles.emptyState}>הכול מסודר להיום</p>
        ) : (
          <div className={styles.attentionList}>
            {data.overdueFollowUps.length > 0 && (
              <div className={styles.attentionGroup}>
                <h3 className={styles.groupTitle}>
                  באיחור ({data.overdueFollowUps.length})
                </h3>
                <ul className={styles.followUpList}>
                  {data.overdueFollowUps.map((fu) => (
                    <FollowUpRow
                      key={fu.id}
                      followUp={fu}
                      leadName={
                        fu.leadId
                          ? leadSummariesMap.get(fu.leadId)
                          : undefined
                      }
                      opportunitySummary={
                        fu.opportunityId
                          ? opportunitySummariesMap.get(fu.opportunityId)
                          : undefined
                      }
                      isOverdue
                    />
                  ))}
                </ul>
              </div>
            )}

            {data.followUpsDueToday.length > 0 && (
              <div className={styles.attentionGroup}>
                <h3 className={styles.groupTitle}>
                  להיום ({data.followUpsDueToday.length})
                </h3>
                <ul className={styles.followUpList}>
                  {data.followUpsDueToday.map((fu) => (
                    <FollowUpRow
                      key={fu.id}
                      followUp={fu}
                      leadName={
                        fu.leadId
                          ? leadSummariesMap.get(fu.leadId)
                          : undefined
                      }
                      opportunitySummary={
                        fu.opportunityId
                          ? opportunitySummariesMap.get(fu.opportunityId)
                          : undefined
                      }
                    />
                  ))}
                </ul>
              </div>
            )}

            {data.unreadLeadCount > 0 && (
              <div className={styles.attentionGroup}>
                <h3 className={styles.groupTitle}>
                  לידים שלא נקראו ({data.unreadLeadCount})
                </h3>
                <p className={styles.attentionNote}>
                  <Link href="/admin/leads" className={styles.link}>
                    צפה בלידים
                  </Link>
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {data.upcomingFollowUps.length > 0 && (
        <section className={styles.upcomingSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              קרובים (7 ימים הבאים)
            </h2>
            <Link
              href="/admin/business/follow-ups?filter=upcoming"
              className={styles.link}
            >
              הצג הכול
            </Link>
          </div>
          <ul className={styles.followUpList}>
            {data.upcomingFollowUps.slice(0, 5).map((fu) => (
              <FollowUpRow
                key={fu.id}
                followUp={fu}
                leadName={
                  fu.leadId
                    ? leadSummariesMap.get(fu.leadId)
                    : undefined
                }
                opportunitySummary={
                  fu.opportunityId
                    ? opportunitySummariesMap.get(fu.opportunityId)
                    : undefined
                }
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function FollowUpRow({
  followUp,
  leadName,
  opportunitySummary,
  isOverdue,
}: {
  followUp: AdminFollowUpDto;
  leadName?: { id: string; leadNumber: number; name: string };
  opportunitySummary?: OpportunitySummary;
  isOverdue?: boolean;
}) {
  return (
    <li className={`${styles.followUpRow} ${isOverdue ? styles.followUpRowOverdue : ""}`}>
      <div className={styles.followUpInfo}>
        <span className={styles.followUpTitle}>{followUp.title}</span>
        <span className={isOverdue ? styles.followUpDateOverdue : styles.followUpDate}>
          {formatDateTime(followUp.dueAt)}
        </span>
      </div>
      <div className={styles.followUpMeta}>
        {leadName && (
          <Link href={`/admin/leads/${leadName.id}`} className={styles.leadLink}>
            #{leadName.leadNumber} — {leadName.name}
          </Link>
        )}
        {!leadName && opportunitySummary && (
          <Link
            href={`/admin/business/opportunities/${opportunitySummary.id}`}
            className={styles.leadLink}
          >
            {opportunitySummary.title}
          </Link>
        )}
        <FollowUpStatusBadge status={followUp.status} />
      </div>
    </li>
  );
}
