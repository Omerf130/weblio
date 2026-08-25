"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  createProjectAction,
  updateProjectAction,
  type ProjectActionState,
} from "@/lib/projects/actions";
import type { AdminProjectDto } from "@/types/project";
import styles from "./ProjectForm.module.scss";

const initialState: ProjectActionState = {};

type ProjectFormProps = {
  project?: AdminProjectDto;
};

export default function ProjectForm({ project }: ProjectFormProps) {
  const action = project ? updateProjectAction : createProjectAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <section className={styles.formSection}>
      <h1 className={styles.title}>
        {project ? "עריכת פרויקט" : "פרויקט חדש"}
      </h1>

      <form className={styles.form} action={formAction}>
        {project ? <input type="hidden" name="id" value={project.id} /> : null}

        <div className={styles.grid}>
          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor="title">
              כותרת
            </label>
            <input
              id="title"
              name="title"
              className={styles.input}
              defaultValue={project?.title ?? ""}
              required
              disabled={isPending}
            />
          </div>

          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor="subtitle">
              תת-כותרת
            </label>
            <input
              id="subtitle"
              name="subtitle"
              className={styles.input}
              defaultValue={project?.subtitle ?? ""}
              disabled={isPending}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="homeTitle">
              כותרת לדף הבית (אופציונלי)
            </label>
            <input
              id="homeTitle"
              name="homeTitle"
              className={styles.input}
              defaultValue={project?.homeTitle ?? ""}
              disabled={isPending}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="homeSubtitle">
              תת-כותרת לדף הבית (אופציונלי)
            </label>
            <input
              id="homeSubtitle"
              name="homeSubtitle"
              className={styles.input}
              defaultValue={project?.homeSubtitle ?? ""}
              disabled={isPending}
            />
          </div>

          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor="imageUrl">
              קישור לתמונה
            </label>
            <input
              id="imageUrl"
              name="imageUrl"
              className={styles.input}
              defaultValue={project?.imageUrl ?? ""}
              placeholder="/pics/example.jpeg"
              required
              disabled={isPending}
            />
            <span className={styles.hint}>
              קישור לתמונה (העלאת קבצים תתווסף בהמשך)
            </span>
          </div>

          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor="imageAlt">
              טקסט חלופי לתמונה
            </label>
            <input
              id="imageAlt"
              name="imageAlt"
              className={styles.input}
              defaultValue={project?.imageAlt ?? ""}
              required
              disabled={isPending}
            />
          </div>

          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor="projectUrl">
              קישור לפרויקט
            </label>
            <input
              id="projectUrl"
              name="projectUrl"
              type="url"
              className={styles.input}
              defaultValue={project?.projectUrl ?? ""}
              placeholder="https://"
              required
              disabled={isPending}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="ctaLabel">
              טקסט כפתור
            </label>
            <input
              id="ctaLabel"
              name="ctaLabel"
              className={styles.input}
              defaultValue={project?.ctaLabel ?? "Take me"}
              disabled={isPending}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="technologies">
              טכנולוגיות (מופרדות בפסיק)
            </label>
            <input
              id="technologies"
              name="technologies"
              className={styles.input}
              defaultValue={project?.technologies.join(", ") ?? ""}
              disabled={isPending}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="homeOrder">
              סדר בדף הבית
            </label>
            <input
              id="homeOrder"
              name="homeOrder"
              type="number"
              min={0}
              className={styles.input}
              defaultValue={project?.homeOrder ?? 0}
              disabled={isPending}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="projectsPageOrder">
              סדר בעמוד פרויקטים
            </label>
            <input
              id="projectsPageOrder"
              name="projectsPageOrder"
              type="number"
              min={0}
              className={styles.input}
              defaultValue={project?.projectsPageOrder ?? 0}
              disabled={isPending}
            />
          </div>
        </div>

        <div className={styles.checkboxRow}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={project?.isPublished ?? false}
              disabled={isPending}
            />
            מפורסם
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="showOnHome"
              defaultChecked={project?.showOnHome ?? false}
              disabled={isPending}
            />
            הצג בדף הבית
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="showOnProjectsPage"
              defaultChecked={project?.showOnProjectsPage ?? true}
              disabled={isPending}
            />
            הצג בעמוד פרויקטים
          </label>
        </div>

        {state.error ? (
          <p className={styles.error} role="alert">
            {state.error}
          </p>
        ) : null}

        <div className={styles.actions}>
          <button type="submit" className={styles.submitButton} disabled={isPending}>
            {isPending ? "שומר..." : "שמירה"}
          </button>
          <Link href="/admin/projects" className={styles.cancelLink}>
            ביטול
          </Link>
        </div>
      </form>
    </section>
  );
}
