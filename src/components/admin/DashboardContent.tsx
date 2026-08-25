"use client";

import { useAdminUser } from "./AdminUserContext";
import styles from "./DashboardContent.module.scss";

const COMING_SOON_CARDS = [
  {
    title: "פניות",
    description: "צפייה וניהול פניות מהטופס באתר.",
  },
  {
    title: "פרויקטים",
    description: "ניהול פרויקטים שמוצגים באתר.",
  },
  {
    title: "תוכן האתר",
    description: "עריכת תוכן עמודי הבית והאתר.",
  },
] as const;

export default function DashboardContent() {
  const admin = useAdminUser();

  return (
    <section className={styles.dashboard}>
      <p className={styles.greeting}>
        שלום {admin.name}, ברוך הבא לפאנל הניהול של Weblio.
      </p>
      <p className={styles.intro}>
        מכאן תוכל לנהל את התוכן, הפרויקטים והפניות של האתר.
      </p>

      <div className={styles.cards}>
        {COMING_SOON_CARDS.map((card) => (
          <article key={card.title} className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>{card.title}</h2>
              <span className={styles.cardBadge}>בקרוב</span>
            </div>
            <p className={styles.cardDescription}>{card.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
