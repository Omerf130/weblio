"use client";

import styles from "./AiMarketingTools.module.scss";

type AiMarketingContentResultPanelProps = {
  resultId: string;
  label?: string;
  content: string;
  onContentChange: (value: string) => void;
  isGenerating: boolean;
  onCopy: () => void;
  onRegenerate: () => void;
  canRegenerate: boolean;
  copyStatus: "idle" | "success" | "failed";
  visible: boolean;
};

export default function AiMarketingContentResultPanel({
  resultId,
  label = "הטיוטה",
  content,
  onContentChange,
  isGenerating,
  onCopy,
  onRegenerate,
  canRegenerate,
  copyStatus,
  visible,
}: AiMarketingContentResultPanelProps) {
  if (!visible && !isGenerating) {
    return null;
  }

  return (
    <section className={styles.resultPanel}>
      <label htmlFor={resultId} className={styles.label}>
        {label}
      </label>
      <textarea
        id={resultId}
        className={styles.resultTextarea}
        rows={12}
        value={content}
        onChange={(event) => onContentChange(event.target.value)}
        disabled={isGenerating}
      />
      <div className={styles.resultActions}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onCopy}
          disabled={!content.trim() || isGenerating}
        >
          העתק
        </button>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={onRegenerate}
          disabled={!canRegenerate}
          aria-busy={isGenerating}
        >
          {isGenerating ? "יוצר מחדש…" : "צור מחדש"}
        </button>
      </div>
      <p className={styles.copyStatus} role="status" aria-live="polite">
        {copyStatus === "success" && "הועתק ללוח."}
        {copyStatus === "failed" && "לא ניתן להעתיק. נסה להעתיק ידנית."}
      </p>
    </section>
  );
}
