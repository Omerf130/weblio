"use client";

import { getDefaultProjectsPageShowcaseObjectPositionPercents } from "@/lib/projects/projects-page-showcase-object-position";
import styles from "./ProjectForm.module.scss";

type ProjectShowcasePositionFieldsProps = {
  defaultX?: number;
  defaultY?: number;
  disabled?: boolean;
};

export default function ProjectShowcasePositionFields({
  defaultX,
  defaultY,
  disabled = false,
}: ProjectShowcasePositionFieldsProps) {
  const defaults = getDefaultProjectsPageShowcaseObjectPositionPercents();
  const x = defaultX ?? defaults.x;
  const y = defaultY ?? defaults.y;

  return (
    <details className={styles.advancedBlock}>
      <summary className={styles.advancedSummary}>מתקדם — מיקום תמונת הרקע</summary>
      <p className={styles.hint}>
        מיקום אופקי ואנכי של תמונת התצוגה בתוך הכרטיס (באחוזים). ברירת מחדל: 50% / 50%.
      </p>
      <div className={styles.positionRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="showcasePositionX">
            מיקום אופקי (X)
          </label>
          <input
            id="showcasePositionX"
            name="showcasePositionX"
            type="number"
            min={0}
            max={100}
            step={1}
            defaultValue={x}
            className={styles.input}
            disabled={disabled}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="showcasePositionY">
            מיקום אנכי (Y)
          </label>
          <input
            id="showcasePositionY"
            name="showcasePositionY"
            type="number"
            min={0}
            max={100}
            step={1}
            defaultValue={y}
            className={styles.input}
            disabled={disabled}
          />
        </div>
      </div>
    </details>
  );
}
