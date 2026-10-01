"use client";

import type { AiMarketingProjectPickerOption } from "@/lib/business/ai-marketing/project-picker-options";
import { findPickerOptionById } from "@/lib/business/ai-marketing/project-picker-options";
import styles from "./AiMarketingTools.module.scss";

const PROJECT_SELECT_ID = "ai-marketing-project-select";

type AiMarketingProjectSelectFieldProps = {
  projects: AiMarketingProjectPickerOption[];
  projectId: string;
  onProjectIdChange: (id: string) => void;
  disabled?: boolean;
};

export default function AiMarketingProjectSelectField({
  projects,
  projectId,
  onProjectIdChange,
  disabled,
}: AiMarketingProjectSelectFieldProps) {
  const selected = findPickerOptionById(projects, projectId);

  if (projects.length === 0) {
    return (
      <p className={styles.emptyState}>
        אין פרויקטים במערכת. הוסף פרויקט בניהול פרויקטים.
      </p>
    );
  }

  return (
    <div className={styles.field}>
      <label htmlFor={PROJECT_SELECT_ID} className={styles.label}>
        פרויקט
      </label>
      <select
        id={PROJECT_SELECT_ID}
        className={styles.select}
        value={projectId}
        onChange={(event) => onProjectIdChange(event.target.value)}
        disabled={disabled}
      >
        <option value="">בחר פרויקט…</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.label}
            {!project.isPublished ? " (לא מפורסם)" : ""}
          </option>
        ))}
      </select>
      {selected ? (
        <p className={styles.fieldHint}>{selected.detail}</p>
      ) : null}
    </div>
  );
}
