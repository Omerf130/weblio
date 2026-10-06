"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import type { ProjectActionState } from "@/lib/projects/action-states";
import {
  PROJECTS_PAGE_FEATURED_OVERFLOW_WARNING,
  shouldWarnProjectsPageFeaturedOverflow,
} from "@/lib/projects/projects-page-featured-admin";
import { parseProjectsPageShowcaseObjectPositionToPercents } from "@/lib/projects/projects-page-showcase-object-position";
import {
  createProjectAction,
  updateProjectAction,
} from "@/lib/projects/actions";
import type { AdminProjectDto } from "@/types/project";
import ProjectFileImageField from "./ProjectFileImageField";
import ProjectImageField from "./ProjectImageField";
import ProjectShowcasePositionFields from "./ProjectShowcasePositionFields";
import styles from "./ProjectForm.module.scss";

const initialState: ProjectActionState = {};

type ProjectFormProps = {
  project?: AdminProjectDto;
  projectsPageFeaturedCount?: number;
};

export default function ProjectForm({
  project,
  projectsPageFeaturedCount = 0,
}: ProjectFormProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [showOnHome, setShowOnHome] = useState(project?.showOnHome ?? false);
  const action = project ? updateProjectAction : createProjectAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  const positionPercents = parseProjectsPageShowcaseObjectPositionToPercents(
    project?.projectsPageShowcaseObjectPosition
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <section className={styles.formSection}>
        <h1 className={styles.title}>
          {project ? "עריכת פרויקט" : "פרויקט חדש"}
        </h1>
        <div className={styles.form} aria-busy="true" aria-label="טוען טופס..." />
      </section>
    );
  }

  const showFeaturedOverflowWarning = shouldWarnProjectsPageFeaturedOverflow(
    projectsPageFeaturedCount
  );

  return (
    <section className={styles.formSection}>
      <h1 className={styles.title}>
        {project ? "עריכת פרויקט" : "פרויקט חדש"}
      </h1>

      <form
        className={styles.form}
        action={formAction}
        suppressHydrationWarning
      >
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

          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor="description">
              תיאור קצר
            </label>
            <p className={styles.hint}>תיאור קצר שיופיע בתצוגת הפרויקט באתר</p>
            <textarea
              id="description"
              name="description"
              className={styles.textarea}
              rows={3}
              defaultValue={project?.description ?? ""}
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

          <ProjectImageField
            currentImageUrl={project?.imageUrl}
            isRequired={showOnHome && !project?.imageUrl?.trim()}
            disabled={isPending}
            helperText={
              showOnHome
                ? "נדרשת תמונת פרויקט ראשית כדי להציג את הפרויקט בדף הבית."
                : "אופציונלי כשהפרויקט מיועד רק לעמוד הפרויקטים (ניתן להסתמך על תמונת התצוגה)."
            }
          />

          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor="imageAlt">
              טקסט חלופי לתמונה (אופציונלי)
            </label>
            <input
              id="imageAlt"
              name="imageAlt"
              className={styles.input}
              defaultValue={project?.imageAlt ?? ""}
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
        </div>

        <fieldset className={styles.formSectionBlock}>
          <legend className={styles.sectionLegend}>עמוד הפרויקטים</legend>

          {showFeaturedOverflowWarning ? (
            <p className={styles.warning} role="status">
              {PROJECTS_PAGE_FEATURED_OVERFLOW_WARNING}
            </p>
          ) : null}

          <div className={styles.grid}>
            <ProjectFileImageField
              id="showcaseImageFile"
              name="showcaseImageFile"
              label="תמונת תצוגה לעמוד הפרויקטים"
              previewAlt="תצוגה מקדימה של תמונת התצוגה לעמוד הפרויקטים"
              helperText="תמונת רקע/תצוגה לכרטיס בעמוד הפרויקטים. כותרת, תיאור וטכנולוגיות מוצגים בנפרד על גבי האתר — לא בתוך התמונה."
              currentImageUrl={project?.projectsPageShowcase?.url}
              disabled={isPending}
              allowRemove={Boolean(project?.projectsPageShowcase?.url)}
            />

            <div className={styles.fieldFull}>
              <label className={styles.label} htmlFor="showcaseImageAlt">
                טקסט חלופי לתמונת תצוגה (אופציונלי)
              </label>
              <input
                id="showcaseImageAlt"
                name="showcaseImageAlt"
                className={styles.input}
                defaultValue={project?.projectsPageShowcase?.alt ?? ""}
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

            <div className={styles.field}>
              <label className={styles.label} htmlFor="projectsPageFeaturedOrder">
                סדר בפרויקטים הנבחרים
              </label>
              <input
                id="projectsPageFeaturedOrder"
                name="projectsPageFeaturedOrder"
                type="number"
                min={0}
                className={styles.input}
                defaultValue={project?.projectsPageFeaturedOrder ?? ""}
                disabled={isPending}
              />
            </div>

            <div className={styles.fieldFull}>
              <label className={styles.label} htmlFor="projectsPageDisplayTitle">
                כותרת תצוגה בעמוד הפרויקטים (אופציונלי)
              </label>
              <p className={styles.hint}>כשהשדה ריק, משתמשים בכותרת הפרויקט הרגילה.</p>
              <input
                id="projectsPageDisplayTitle"
                name="projectsPageDisplayTitle"
                className={styles.input}
                defaultValue={project?.projectsPageDisplayTitle ?? ""}
                disabled={isPending}
              />
            </div>

            <ProjectShowcasePositionFields
              defaultX={positionPercents?.x}
              defaultY={positionPercents?.y}
              disabled={isPending}
            />
          </div>

          <div className={styles.checkboxRow}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="showOnProjectsPage"
                defaultChecked={project?.showOnProjectsPage ?? true}
                disabled={isPending}
              />
              הצג בעמוד פרויקטים
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="featuredOnProjectsPage"
                defaultChecked={project?.featuredOnProjectsPage ?? false}
                disabled={isPending}
              />
              פרויקט נבחר בעמוד הפרויקטים
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="projectsPageShowFeaturedBadge"
                defaultChecked={project?.projectsPageShowFeaturedBadge ?? false}
                disabled={isPending}
              />
              הצג תג &quot;פרויקט נבחר&quot;
            </label>
          </div>
        </fieldset>

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
              onChange={(event) => setShowOnHome(event.target.checked)}
            />
            הצג בדף הבית
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
