import { getBusinessOverviewData } from "@/lib/business/overview-data";
import styles from "./business.module.scss";

export default async function BusinessOverviewPage() {
  const data = await getBusinessOverviewData();

  return (
    <div className={styles.page} dir="rtl">
      <header className={styles.header}>
        <h1 className={styles.heading}>סקירה עסקית</h1>
        <p className={styles.subtitle}>מה דורש תשומת לב היום</p>
      </header>

      <div className={styles.grid}>
        <div className={styles.card}>
          <span className={styles.cardValue}>{data.overdueFollowUps.length}</span>
          <span className={styles.cardLabel}>מעקבים באיחור</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardValue}>{data.followUpsDueToday.length}</span>
          <span className={styles.cardLabel}>מעקבים להיום</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardValue}>{data.upcomingFollowUps.length}</span>
          <span className={styles.cardLabel}>מעקבים קרובים</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardValue}>{data.unreadLeadCount}</span>
          <span className={styles.cardLabel}>לידים שלא נקראו</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardValue}>{data.newLeadsLast7Days}</span>
          <span className={styles.cardLabel}>לידים חדשים (7 ימים)</span>
        </div>
      </div>
    </div>
  );
}
