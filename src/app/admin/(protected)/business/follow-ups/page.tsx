import {
  getPendingFollowUpsDueToday,
  getOverdueFollowUps,
  getUpcomingFollowUps,
} from "@/lib/data/follow-ups";
import styles from "./follow-ups.module.scss";

export default async function FollowUpsPage() {
  const [dueToday, overdue, upcoming] = await Promise.all([
    getPendingFollowUpsDueToday(),
    getOverdueFollowUps(),
    getUpcomingFollowUps(7),
  ]);

  const totalPending = dueToday.length + overdue.length + upcoming.length;

  return (
    <div className={styles.page} dir="rtl">
      <header className={styles.header}>
        <h1 className={styles.heading}>מעקבים</h1>
        <p className={styles.subtitle}>
          {totalPending === 0
            ? "אין מעקבים פתוחים"
            : `${totalPending} מעקבים פתוחים`}
        </p>
      </header>

      {overdue.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>באיחור ({overdue.length})</h2>
          <ul className={styles.list}>
            {overdue.map((fu) => (
              <li key={fu.id} className={styles.item}>
                <span className={styles.itemTitle}>{fu.title}</span>
                <span className={styles.itemDate}>
                  {new Date(fu.dueAt).toLocaleDateString("he-IL")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {dueToday.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>להיום ({dueToday.length})</h2>
          <ul className={styles.list}>
            {dueToday.map((fu) => (
              <li key={fu.id} className={styles.item}>
                <span className={styles.itemTitle}>{fu.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>קרובים ({upcoming.length})</h2>
          <ul className={styles.list}>
            {upcoming.map((fu) => (
              <li key={fu.id} className={styles.item}>
                <span className={styles.itemTitle}>{fu.title}</span>
                <span className={styles.itemDate}>
                  {new Date(fu.dueAt).toLocaleDateString("he-IL")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {totalPending === 0 && (
        <p className={styles.empty}>כל המעקבים הושלמו או שאין מעקבים פתוחים כרגע.</p>
      )}
    </div>
  );
}
