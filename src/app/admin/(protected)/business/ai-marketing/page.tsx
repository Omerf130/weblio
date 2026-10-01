import AiMarketingShell from "@/components/admin/business/ai-marketing/AiMarketingShell";
import { getMarketingAdminStatus } from "@/lib/business/ai-marketing/marketing-admin-status";
import { mapAdminProjectsToPickerOptions } from "@/lib/business/ai-marketing/project-picker-options";
import { getAdminProjects } from "@/lib/data/projects";
import styles from "../business.module.scss";
import shellStyles from "./ai-marketing.module.scss";

export default async function AiMarketingPage() {
  const status = getMarketingAdminStatus();
  const projects =
    status.state === "ready"
      ? mapAdminProjectsToPickerOptions(await getAdminProjects())
      : [];

  return (
    <div className={styles.page} dir="rtl">
      <header className={styles.header}>
        <h1 className={styles.heading}>שיווק AI</h1>
        <p className={styles.subtitle}>
          כלי פנימי לטיוטות תוכן בלבד - אתה בוחר, עורך ומפרסם בעצמך
        </p>
      </header>

      <section className={shellStyles.panel} aria-live="polite">
        <h2 className={shellStyles.panelTitle}>מצב המערכת</h2>
        <p
          className={
            status.state === "ready"
              ? shellStyles.statusReady
              : shellStyles.statusInactive
          }
        >
          {status.message}
        </p>
        {status.state !== "ready" && (
          <p className={shellStyles.disclaimer}>
            יצירת טיוטות תופיע כאן לאחר הפעלת AI Marketing בסביבה.
          </p>
        )}
      </section>

      {status.state === "ready" ? (
        <AiMarketingShell projects={projects} />
      ) : null}
    </div>
  );
}
