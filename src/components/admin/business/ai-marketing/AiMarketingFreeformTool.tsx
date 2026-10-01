"use client";

import { useCallback, useState } from "react";
import { generateMarketingDraftAction } from "@/lib/business/ai-marketing/actions";
import { buildFreeformPurposeInput } from "@/lib/business/ai-marketing/marketing-input-builders";
import { MAX_MARKETING_USER_INSTRUCTION_CHARS } from "@/lib/business/ai-marketing/validations";
import AiMarketingContentResultPanel from "./AiMarketingContentResultPanel";
import styles from "./AiMarketingTools.module.scss";

type AiMarketingFreeformToolProps = {
  onBack: () => void;
};

export default function AiMarketingFreeformTool({
  onBack,
}: AiMarketingFreeformToolProps) {
  const [userInstruction, setUserInstruction] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "failed">(
    "idle"
  );

  const canGenerate = userInstruction.trim().length > 0 && !isGenerating;

  const runGeneration = useCallback(async () => {
    if (!userInstruction.trim()) {
      setError("כתוב מה תרצה שאכתוב.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setCopyStatus("idle");

    try {
      const result = await generateMarketingDraftAction(
        buildFreeformPurposeInput({ userInstruction })
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.content) {
        setDraftContent(result.content);
        return;
      }

      setError("לא התקבלה טיוטה. נסה שוב.");
    } catch {
      setError("לא ניתן ליצור טיוטה כרגע.");
    } finally {
      setIsGenerating(false);
    }
  }, [userInstruction]);

  const handleCopy = useCallback(async () => {
    if (!draftContent.trim()) {
      return;
    }
    try {
      await navigator.clipboard.writeText(draftContent);
      setCopyStatus("success");
    } catch {
      setCopyStatus("failed");
    }
  }, [draftContent]);

  return (
    <div className={styles.workspace}>
      <section className={styles.panel}>
        <button type="button" className={styles.backButton} onClick={onBack}>
          ← חזרה
        </button>
        <h2 className={styles.sectionTitle}>כתיבה חופשית</h2>
        <p className={styles.sectionHint}>
          הנחיה גמישה לכל סוג טקסט - אתה עורך ומעתיק בעצמך.
        </p>

        <div className={styles.field}>
          <label htmlFor="freeform-instruction" className={styles.label}>
            מה תרצה שאכתוב?
          </label>
          <textarea
            id="freeform-instruction"
            className={styles.textarea}
            rows={5}
            maxLength={MAX_MARKETING_USER_INSTRUCTION_CHARS}
            value={userInstruction}
            onChange={(e) => setUserInstruction(e.target.value)}
            disabled={isGenerating}
            placeholder="למשל: טקסט לסקשן חדש באתר, הודעה ללקוח, ניסוח CTA…"
          />
        </div>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        {isGenerating ? (
          <p className={styles.loadingHint} role="status" aria-live="polite">
            יוצר טיוטה… זה עשוי לקחת כמה שניות.
          </p>
        ) : null}

        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => void runGeneration()}
          disabled={!canGenerate}
          aria-busy={isGenerating}
        >
          {isGenerating ? "יוצר טיוטה…" : "צור טיוטה"}
        </button>
      </section>

      <AiMarketingContentResultPanel
        resultId="freeform-result"
        content={draftContent}
        onContentChange={setDraftContent}
        isGenerating={isGenerating}
        onCopy={() => void handleCopy()}
        onRegenerate={() => void runGeneration()}
        canRegenerate={canGenerate}
        copyStatus={copyStatus}
        visible={Boolean(draftContent)}
      />
    </div>
  );
}
