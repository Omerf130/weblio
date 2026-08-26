"use client";

import Link from "next/link";
import { useAdminUser } from "./AdminUserContext";
import styles from "./DashboardContent.module.scss";

const QUICK_LINKS = [
  {
    title: "פניות",
    description: "צפייה וניהול פניות מהטופס באתר.",
    href: "/admin/leads",
    ready: true,
  },
  {
    title: "פרויקטים",
    description: "ניהול פרויקטים שמוצגים באתר.",
    href: "/admin/projects",
    ready: true,
  },
  {
    title: "תוכן האתר",
    description: "עריכת תוכן עמודי הבית והאתר.",
    ready: false,
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
        {QUICK_LINKS.map((card) => (
          <article key={card.title} className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>{card.title}</h2>
              {card.ready ? (
                "href" in card && card.href ? (
                  <Link href={card.href} className={styles.cardLink}>
                    כניסה
                  </Link>
                ) : null
              ) : (
                <span className={styles.cardBadge}>בקרוב</span>
              )}
            </div>
            <p className={styles.cardDescription}>{card.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
