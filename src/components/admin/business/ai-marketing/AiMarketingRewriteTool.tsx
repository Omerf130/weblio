"use client";

import { useCallback, useState } from "react";
import { generateMarketingDraftAction } from "@/lib/business/ai-marketing/actions";
import { buildRewritePurposeInput } from "@/lib/business/ai-marketing/marketing-input-builders";
import { REWRITE_TRANSFORMATION_OPTIONS } from "@/lib/business/ai-marketing/rewrite-ui";
import type { RewriteTransformation } from "@/lib/business/ai-marketing/types";
import {
  MAX_MARKETING_SOURCE_TEXT_CHARS,
  MAX_MARKETING_USER_INSTRUCTION_CHARS,
} from "@/lib/business/ai-marketing/validations";
import AiMarketingContentResultPanel from "./AiMarketingContentResultPanel";
import styles from "./AiMarketingTools.module.scss";

type AiMarketingRewriteToolProps = {
  onBack: () => void;
};

export default function AiMarketingRewriteTool({
  onBack,
}: AiMarketingRewriteToolProps) {
  const [sourceText, setSourceText] = useState("");
  const [transformation, setTransformation] =
    useState<RewriteTransformation>("shorter");
  const [userInstruction, setUserInstruction] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "failed">(
    "idle"
  );

  const canGenerate = sourceText.trim().length > 0 && !isGenerating;

  const runGeneration = useCallback(async () => {
    if (!sourceText.trim()) {
      setError("הדבק טקסט לשיפור.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setCopyStatus("idle");

    try {
      const result = await generateMarketingDraftAction(
        buildRewritePurposeInput({
          sourceText,
          transformation,
          userInstruction: userInstruction.trim() || undefined,
        })
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.content) {
        setDraftContent(result.content);
        return;
      }

      setError("לא התקבל טקסט משופר. נסה שוב.");
    } catch {
      setError("לא ניתן לשפר את הטקסט כרגע.");
    } finally {
      setIsGenerating(false);
    }
  }, [sourceText, transformation, userInstruction]);

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
        <h2 className={styles.sectionTitle}>שיפור טקסט</h2>
        <p className={styles.sectionHint}>
          הדבק טקסט קיים ובחר סוג שיפור. העובדות נשמרות - לא מוסיפים פרטים
          חדשים.
        </p>

        <div className={styles.field}>
          <label htmlFor="rewrite-source" className={styles.label}>
            הטקסט לשיפור
          </label>
          <textarea
            id="rewrite-source"
            className={styles.textarea}
            rows={8}
            maxLength={MAX_MARKETING_SOURCE_TEXT_CHARS}
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            disabled={isGenerating}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>סוג שיפור</span>
          <div className={styles.transformGrid}>
            {REWRITE_TRANSFORMATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={
                  transformation === option.value
                    ? styles.sourceSwitchActive
                    : styles.sourceSwitchButton
                }
                onClick={() => setTransformation(option.value)}
                disabled={isGenerating}
                aria-pressed={transformation === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="rewrite-instruction" className={styles.label}>
            הנחיה נוספת (לא חובה)
          </label>
          <textarea
            id="rewrite-instruction"
            className={styles.textarea}
            rows={2}
            maxLength={MAX_MARKETING_USER_INSTRUCTION_CHARS}
            value={userInstruction}
            onChange={(e) => setUserInstruction(e.target.value)}
            disabled={isGenerating}
            placeholder="למשל: שמור על הטון קליל"
          />
        </div>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        {isGenerating ? (
          <p className={styles.loadingHint} role="status" aria-live="polite">
            משפר טקסט… זה עשוי לקחת כמה שניות.
          </p>
        ) : null}

        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => void runGeneration()}
          disabled={!canGenerate}
          aria-busy={isGenerating}
        >
          {isGenerating ? "משפר…" : "שפר טקסט"}
        </button>
      </section>

      <AiMarketingContentResultPanel
        resultId="rewrite-result"
        label="הטקסט המשופר"
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
