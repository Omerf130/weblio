"use client";

import { useCallback, useState } from "react";
import { generateMarketingDraftAction } from "@/lib/business/ai-marketing/actions";
import { buildContentIdeasInput } from "@/lib/business/ai-marketing/marketing-input-builders";
import type { AiMarketingProjectPickerOption } from "@/lib/business/ai-marketing/project-picker-options";
import { findPickerOptionById } from "@/lib/business/ai-marketing/project-picker-options";
import { MAX_MARKETING_USER_INSTRUCTION_CHARS } from "@/lib/business/ai-marketing/validations";
import AiMarketingProjectSelectField from "./AiMarketingProjectSelectField";
import styles from "./AiMarketingTools.module.scss";

type IdeasMode = "globalWeblio" | "project";

type AiMarketingContentIdeasToolProps = {
  projects: AiMarketingProjectPickerOption[];
  onBack: () => void;
};

export default function AiMarketingContentIdeasTool({
  projects,
  onBack,
}: AiMarketingContentIdeasToolProps) {
  const [mode, setMode] = useState<IdeasMode>("globalWeblio");
  const [projectId, setProjectId] = useState("");
  const [userInstruction, setUserInstruction] = useState("");
  const [ideas, setIdeas] = useState<string[]>([]);
  const [resultMode, setResultMode] = useState<IdeasMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyIndex, setCopyIndex] = useState<number | "all" | null>(null);

  const clearIdeas = () => {
    setIdeas([]);
    setResultMode(null);
    setCopyIndex(null);
  };

  const canGenerate =
    !isGenerating &&
    (mode === "globalWeblio" ||
      (Boolean(projectId) &&
        findPickerOptionById(projects, projectId) !== undefined));

  const stale = resultMode !== null && resultMode !== mode;

  const runGeneration = useCallback(async () => {
    if (mode === "project" && !findPickerOptionById(projects, projectId)) {
      setError("בחר פרויקט מהרשימה.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setCopyIndex(null);

    try {
      const result = await generateMarketingDraftAction(
        buildContentIdeasInput({
          mode,
          projectId: mode === "project" ? projectId : undefined,
          userInstruction: userInstruction.trim() || undefined,
        })
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.ideas?.length) {
        setIdeas(result.ideas);
        setResultMode(mode);
        return;
      }

      setError("לא התקבלו רעיונות. נסה שוב.");
    } catch {
      setError("לא ניתן ליצור רעיונות כרגע.");
    } finally {
      setIsGenerating(false);
    }
  }, [mode, projectId, userInstruction, projects]);

  const copyText = async (text: string, marker: number | "all") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyIndex(marker);
    } catch {
      setCopyIndex(null);
      setError("לא ניתן להעתיק. נסה להעתיק ידנית.");
    }
  };

  return (
    <div className={styles.workspace}>
      <section className={styles.panel}>
        <button type="button" className={styles.backButton} onClick={onBack}>
          ← חזרה
        </button>
        <h2 className={styles.sectionTitle}>רעיונות לתוכן</h2>
        <p className={styles.sectionHint}>
          רשימת רעיונות קצרים לפוסטים, סטורי או תוכן ל-Weblio.
        </p>

        <div className={styles.field}>
          <span className={styles.label}>סוג רעיונות</span>
          <div className={styles.sourceSwitch} role="group">
            <button
              type="button"
              className={
                mode === "globalWeblio"
                  ? styles.sourceSwitchActive
                  : styles.sourceSwitchButton
              }
              onClick={() => {
                if (mode !== "globalWeblio") {
                  clearIdeas();
                  setError(null);
                }
                setMode("globalWeblio");
              }}
              disabled={isGenerating}
              aria-pressed={mode === "globalWeblio"}
            >
              רעיונות כלליים ל-Weblio
            </button>
            <button
              type="button"
              className={
                mode === "project"
                  ? styles.sourceSwitchActive
                  : styles.sourceSwitchButton
              }
              onClick={() => {
                if (mode !== "project") {
                  clearIdeas();
                  setError(null);
                }
                setMode("project");
              }}
              disabled={isGenerating}
              aria-pressed={mode === "project"}
            >
              רעיונות סביב פרויקט
            </button>
          </div>
        </div>

        {mode === "project" ? (
          <AiMarketingProjectSelectField
            projects={projects}
            projectId={projectId}
            onProjectIdChange={(id) => {
              setProjectId(id);
              setError(null);
              clearIdeas();
            }}
            disabled={isGenerating}
          />
        ) : null}

        <div className={styles.field}>
          <label htmlFor="ideas-instruction" className={styles.label}>
            הנחיה נוספת (אופציונלי)
          </label>
          <textarea
            id="ideas-instruction"
            className={styles.textarea}
            rows={2}
            maxLength={MAX_MARKETING_USER_INSTRUCTION_CHARS}
            value={userInstruction}
            onChange={(e) => setUserInstruction(e.target.value)}
            disabled={isGenerating}
          />
        </div>

        {stale ? (
          <p className={styles.notice} role="status">
            שינית מצב - צור רעיונות מחדש.
          </p>
        ) : null}

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        {isGenerating ? (
          <p className={styles.loadingHint} role="status" aria-live="polite">
            יוצר רעיונות… זה עשוי לקחת כמה שניות.
          </p>
        ) : null}

        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => void runGeneration()}
          disabled={!canGenerate}
          aria-busy={isGenerating}
        >
          {isGenerating ? "יוצר רעיונות…" : "צור רעיונות"}
        </button>
      </section>

      {ideas.length > 0 && !stale ? (
        <section className={styles.resultPanel}>
          <div className={styles.ideasHeader}>
            <h3 className={styles.sectionTitle}>רעיונות</h3>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() =>
                void copyText(ideas.join("\n"), "all")
              }
              disabled={isGenerating}
            >
              העתק הכל
            </button>
          </div>
          <ul className={styles.ideasList}>
            {ideas.map((idea, index) => (
              <li key={`${index}-${idea.slice(0, 24)}`} className={styles.ideaItem}>
                <p className={styles.ideaText}>{idea}</p>
                <button
                  type="button"
                  className={styles.ideaCopyButton}
                  onClick={() => void copyText(idea, index)}
                  disabled={isGenerating}
                >
                  העתק
                </button>
              </li>
            ))}
          </ul>
          <p className={styles.copyStatus} role="status" aria-live="polite">
            {copyIndex === "all" && "כל הרעיונות הועתקו."}
            {typeof copyIndex === "number" && "הרעיון הועתק."}
          </p>
          <div className={styles.resultActions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => void runGeneration()}
              disabled={!canGenerate}
              aria-busy={isGenerating}
            >
              {isGenerating ? "יוצר מחדש…" : "צור מחדש"}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
