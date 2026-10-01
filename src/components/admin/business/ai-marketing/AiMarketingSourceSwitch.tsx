"use client";

import styles from "./AiMarketingTools.module.scss";

export type AiMarketingSourceMode = "project" | "freeTopic";

type AiMarketingSourceSwitchProps = {
  value: AiMarketingSourceMode;
  onChange: (mode: AiMarketingSourceMode) => void;
  disabled?: boolean;
};

export default function AiMarketingSourceSwitch({
  value,
  onChange,
  disabled = false,
}: AiMarketingSourceSwitchProps) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>מאיפה ניצור את התוכן?</span>
      <div className={styles.sourceSwitch} role="group" aria-label="מקור התוכן">
        <button
          type="button"
          className={
            value === "project"
              ? styles.sourceSwitchActive
              : styles.sourceSwitchButton
          }
          onClick={() => onChange("project")}
          disabled={disabled}
          aria-pressed={value === "project"}
        >
          פרויקט קיים
        </button>
        <button
          type="button"
          className={
            value === "freeTopic"
              ? styles.sourceSwitchActive
              : styles.sourceSwitchButton
          }
          onClick={() => onChange("freeTopic")}
          disabled={disabled}
          aria-pressed={value === "freeTopic"}
        >
          נושא חופשי
        </button>
      </div>
    </div>
  );
}
