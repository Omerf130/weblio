"use client";

import Link from "next/link";
import type { AdminProjectDto } from "@/types/project";
import { hasDuplicateOrderValues } from "@/lib/projects/rules";
import DeleteProjectButton from "./DeleteProjectButton";
import PublishToggleButton from "./PublishToggleButton";
import styles from "./ProjectsList.module.scss";

type ProjectsListProps = {
  projects: AdminProjectDto[];
  errorMessage?: string;
  warningMessage?: string;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={`${styles.badge} ${published ? styles.badgePublished : styles.badgeDraft}`}
    >
      {published ? "מפורסם" : "טיוטה"}
    </span>
  );
}

function ProjectsPageIndicators({ project }: { project: AdminProjectDto }) {
  const hasShowcase = Boolean(project.projectsPageShowcase?.url?.trim());

  return (
    <div className={styles.pageIndicators} aria-label="סימונים לעמוד הפרויקטים">
      <span
        className={`${styles.pageIndicator} ${hasShowcase ? styles.pageIndicatorOn : styles.pageIndicatorOff}`}
        title={hasShowcase ? "יש תמונת תצוגה" : "אין תמונת תצוגה"}
      >
        תצוגה
      </span>
      <span
        className={`${styles.pageIndicator} ${project.showOnProjectsPage ? styles.pageIndicatorOn : styles.pageIndicatorOff}`}
        title={project.showOnProjectsPage ? "מוצג בעמוד הפרויקטים" : "לא מוצג בעמוד הפרויקטים"}
      >
        בעמוד
      </span>
      <span
        className={`${styles.pageIndicator} ${project.featuredOnProjectsPage ? styles.pageIndicatorOn : styles.pageIndicatorOff}`}
        title={
          project.featuredOnProjectsPage
            ? "פרויקט נבחר בעמוד הפרויקטים"
            : "לא מסומן כפרויקט נבחר"
        }
      >
        נבחר
      </span>
    </div>
  );
}

export default function ProjectsList({
  projects,
  errorMessage,
  warningMessage,
}: ProjectsListProps) {
  const duplicateHomeOrder = hasDuplicateOrderValues(projects, "homeOrder");
  const duplicatePageOrder = hasDuplicateOrderValues(projects, "projectsPageOrder");

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h1 className={styles.title}>פרויקטים</h1>
        <Link href="/admin/projects/new" className={styles.newButton}>
          פרויקט חדש
        </Link>
      </div>

      {errorMessage ? (
        <p className={styles.alert} role="alert">
          {errorMessage}
        </p>
      ) : null}

      {warningMessage ? (
        <p className={styles.warning} role="status">
          {warningMessage}
        </p>
      ) : null}

      {duplicateHomeOrder || duplicatePageOrder ? (
        <p className={styles.warning}>
          {duplicateHomeOrder ? "קיימים פרויקטים עם אותו סדר בדף הבית. " : ""}
          {duplicatePageOrder ? "קיימים פרויקטים עם אותו סדר בעמוד הפרויקטים." : ""}
        </p>
      ) : null}

      {projects.length === 0 ? (
        <div className={styles.empty}>עדיין לא קיימים פרויקטים.</div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>תמונה</th>
                  <th>כותרת</th>
                  <th>סטטוס</th>
                  <th>בית</th>
                  <th>עמוד הפרויקטים</th>
                  <th>סדר בית</th>
                  <th>סדר עמוד</th>
                  <th>עודכן</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <img
                        src={project.imageUrl}
                        alt={project.imageAlt}
                        className={styles.thumb}
                      />
                    </td>
                    <td>{project.title}</td>
                    <td>
                      <StatusBadge published={project.isPublished} />
                    </td>
                    <td>{project.showOnHome ? "כן" : "לא"}</td>
                    <td>
                      <ProjectsPageIndicators project={project} />
                    </td>
                    <td>{project.homeOrder}</td>
                    <td>{project.projectsPageOrder}</td>
                    <td>{formatDate(project.updatedAt)}</td>
                    <td>
                      <div className={styles.actions}>
                        <Link
                          href={`/admin/projects/${project.id}`}
                          className={styles.linkButton}
                        >
                          עריכה
                        </Link>
                        <PublishToggleButton
                          id={project.id}
                          isPublished={project.isPublished}
                        />
                        <DeleteProjectButton id={project.id} title={project.title} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.cards}>
            {projects.map((project) => (
              <article key={project.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>{project.title}</h2>
                  <StatusBadge published={project.isPublished} />
                </div>
                <img
                  src={project.imageUrl}
                  alt={project.imageAlt}
                  className={styles.thumb}
                />
                <ProjectsPageIndicators project={project} />
                <div className={styles.meta}>
                  <span>בית: {project.showOnHome ? "כן" : "לא"}</span>
                  <span>סדר בית: {project.homeOrder}</span>
                  <span>סדר עמוד: {project.projectsPageOrder}</span>
                  <span>עודכן: {formatDate(project.updatedAt)}</span>
                </div>
                <div className={styles.actions}>
                  <Link
                    href={`/admin/projects/${project.id}`}
                    className={styles.linkButton}
                  >
                    עריכה
                  </Link>
                  <PublishToggleButton
                    id={project.id}
                    isPublished={project.isPublished}
                  />
                  <DeleteProjectButton id={project.id} title={project.title} />
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
