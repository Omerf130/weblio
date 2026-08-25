import { requireAdmin } from "@/lib/auth/require-admin";
import styles from "./dashboard.module.scss";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  return (
    <section className={styles.dashboard}>
      <h1 className={styles.title}>לוח בקרה</h1>
      <p className={styles.greeting}>
        שלום {admin.name}, ברוך הבא לפאנל הניהול של Weblio.
      </p>
      <p className={styles.message}>
        מערכת הניהול מוכנה. תוכן האתר, פניות ופרויקטים יופיעו כאן בצ&apos;קפוינטים
        הבאים.
      </p>
    </section>
  );
}
