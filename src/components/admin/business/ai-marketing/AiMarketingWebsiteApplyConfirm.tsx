"use client";

import { useEffect } from "react";
import { formatTechnologiesForInput } from "@/lib/business/ai-marketing/technologies-input";
import type { WebsiteProjectContentFields } from "@/lib/business/ai-marketing/types";
import styles from "./AiMarketingTools.module.scss";

const TEXT_FIELD_LABELS: {
  key: Exclude<keyof WebsiteProjectContentFields, "technologies">;
  label: string;
}[] = [
  { key: "title", label: "כותרת" },
  { key: "subtitle", label: "תת-כותרת" },
  { key: "description", label: "תיאור קצר" },
  { key: "homeTitle", label: "כותרת לדף הבית" },
  { key: "homeSubtitle", label: "תת-כותרת לדף הבית" },
];

type AiMarketingWebsiteApplyConfirmProps = {
  projectLabel: string;
  fields: WebsiteProjectContentFields;
  isApplying: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function AiMarketingWebsiteApplyConfirm({
  projectLabel,
  fields,
  isApplying,
  onCancel,
  onConfirm,
}: AiMarketingWebsiteApplyConfirmProps) {
  const technologiesPreview = formatTechnologiesForInput(fields.technologies);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isApplying) {
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isApplying, onCancel]);

  return (
    <div
      className={styles.modalOverlay}
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isApplying) {
          onCancel();
        }
      }}
    >
      <div
        className={styles.modalDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="website-apply-title"
      >
        <h3 id="website-apply-title" className={styles.modalTitle}>
          לעדכן את התוכן של {projectLabel} בפרטים שמופיעים כאן?
        </h3>
        <p className={styles.modalLead}>
          התוכן הקיים בשדות האלה יוחלף, כולל רשימת הטכנולוגיות.
        </p>

        <ul className={styles.modalFieldList}>
          {TEXT_FIELD_LABELS.map(({ key, label }) => {
            const raw = fields[key];
            const display =
              raw === undefined || raw === ""
                ? "- (ריק / יוסר)"
                : raw.length > 80
                  ? `${raw.slice(0, 80)}…`
                  : raw;
            return (
              <li key={key}>
                <span className={styles.modalFieldName}>{label}:</span>{" "}
                <span className={styles.modalFieldValue}>{display}</span>
              </li>
            );
          })}
          <li>
            <span className={styles.modalFieldName}>טכנולוגיות:</span>{" "}
            <span className={styles.modalFieldValue}>
              {technologiesPreview.trim() ? technologiesPreview : "- (ריק)"}
            </span>
          </li>
        </ul>

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onCancel}
            disabled={isApplying}
          >
            ביטול
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onConfirm}
            disabled={isApplying}
            aria-busy={isApplying}
          >
            {isApplying ? "מעדכן…" : "עדכן את הפרויקט"}
          </button>
        </div>
      </div>
    </div>
  );
}
