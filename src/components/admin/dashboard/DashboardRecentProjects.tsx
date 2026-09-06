"use client";

import Link from "next/link";
import { MdChevronLeft } from "react-icons/md";
import { formatIsraelDateTime } from "@/lib/admin/dashboard-time";
import type { DashboardProjectSummary } from "@/types/dashboard";
import styles from "../DashboardContent.module.scss";

type DashboardRecentProjectsProps = {
  projects: DashboardProjectSummary[];
};

export default function DashboardRecentProjects({
  projects,
}: DashboardRecentProjectsProps) {
  return (
    <section className={styles.projectsPanel} aria-label="פרויקטים אחרונים">
      <div className={styles.panelHeaderRow}>
        <h3 className={styles.panelTitle}>פרויקטים אחרונים</h3>
        <Link href="/admin/projects" className={styles.panelLink}>
          צפייה בכל הפרויקטים
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className={styles.emptyState}>עדיין לא נוספו פרויקטים.</p>
      ) : (
        <ul className={styles.projectsGrid}>
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/admin/projects/${project.id}`}
                className={styles.projectCard}
              >
                <span className={styles.projectCardMedia}>
                  <img
                    src={project.imageUrl}
                    alt={project.imageAlt}
                    className={styles.projectCardImage}
                    loading="lazy"
                  />
                </span>
                <span className={styles.projectCardBody}>
                  <span className={styles.projectCardTitleRow}>
                    <strong className={styles.projectCardTitle}>
                      {project.title}
                    </strong>
                    <MdChevronLeft
                      className={styles.projectCardArrow}
                      aria-hidden
                    />
                  </span>
                  <span className={styles.projectCardDate}>
                    {formatIsraelDateTime(project.updatedAt)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
