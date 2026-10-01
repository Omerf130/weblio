"use client";

import { useCallback, useState } from "react";
import { generateMarketingDraftAction } from "@/lib/business/ai-marketing/actions";
import type { AiMarketingProjectPickerOption } from "@/lib/business/ai-marketing/project-picker-options";
import { findPickerOptionById } from "@/lib/business/ai-marketing/project-picker-options";
import { buildProjectPurposeInput } from "@/lib/business/ai-marketing/purpose-ui";
import { MARKETING_HUB_PURPOSE_CARDS } from "@/lib/business/ai-marketing/purpose-ui";
import type { HubMarketingPurpose } from "@/lib/business/ai-marketing/types";
import { MAX_MARKETING_USER_INSTRUCTION_CHARS } from "@/lib/business/ai-marketing/validations";
import AiMarketingProjectSelectField from "./AiMarketingProjectSelectField";
import styles from "./AiMarketingTools.module.scss";

const INSTRUCTION_ID = "ai-marketing-content-instruction";
const RESULT_ID = "ai-marketing-content-result";

type ContentToolPurpose = Extract<
  HubMarketingPurpose,
  "socialPost" | "linkedinPost" | "story"
>;

type AiMarketingContentToolProps = {
  purpose: ContentToolPurpose;
  projects: AiMarketingProjectPickerOption[];
  onBack: () => void;
};

function getToolMeta(purpose: ContentToolPurpose) {
  return MARKETING_HUB_PURPOSE_CARDS.find((c) => c.purpose === purpose);
}

export default function AiMarketingContentTool({
  purpose,
  projects,
  onBack,
}: AiMarketingContentToolProps) {
  const meta = getToolMeta(purpose);
  const [projectId, setProjectId] = useState("");
  const [userInstruction, setUserInstruction] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "failed">(
    "idle"
  );

  const canGenerate =
    Boolean(projectId) &&
    findPickerOptionById(projects, projectId) !== undefined &&
    !isGenerating;

  const runGeneration = useCallback(async () => {
    if (!projectId || !findPickerOptionById(projects, projectId)) {
      setError("בחר פרויקט מהרשימה.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setCopyStatus("idle");

    const payload = buildProjectPurposeInput({
      purpose,
      projectId,
      userInstruction: userInstruction.trim() || undefined,
    });

    try {
      const result = await generateMarketingDraftAction(payload);

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
  }, [projectId, purpose, userInstruction, projects]);

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

  const title = meta?.label ?? "טיוטה";

  return (
    <div className={styles.workspace}>
      <section className={styles.panel}>
        <button type="button" className={styles.backButton} onClick={onBack}>
          ← חזרה
        </button>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {meta ? (
          <p className={styles.sectionHint}>{meta.description}</p>
        ) : null}

        <AiMarketingProjectSelectField
          projects={projects}
          projectId={projectId}
          onProjectIdChange={(id) => {
            setProjectId(id);
            setError(null);
          }}
          disabled={isGenerating}
        />

        <div className={styles.field}>
          <label htmlFor={INSTRUCTION_ID} className={styles.label}>
            הנחיה נוספת (אופציונלי)
          </label>
          <textarea
            id={INSTRUCTION_ID}
            className={styles.textarea}
            rows={3}
            maxLength={MAX_MARKETING_USER_INSTRUCTION_CHARS}
            value={userInstruction}
            onChange={(event) => setUserInstruction(event.target.value)}
            disabled={isGenerating}
          />
        </div>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
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

      {draftContent || isGenerating ? (
        <section className={styles.resultPanel}>
          <label htmlFor={RESULT_ID} className={styles.label}>
            הטיוטה
          </label>
          <textarea
            id={RESULT_ID}
            className={styles.resultTextarea}
            rows={12}
            value={draftContent}
            onChange={(event) => setDraftContent(event.target.value)}
            disabled={isGenerating}
          />
          <div className={styles.resultActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => void handleCopy()}
              disabled={!draftContent.trim() || isGenerating}
            >
              העתק
            </button>
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
          <p className={styles.copyStatus} role="status" aria-live="polite">
            {copyStatus === "success" && "הועתק ללוח."}
            {copyStatus === "failed" && "לא ניתן להעתיק. נסה להעתיק ידנית."}
          </p>
        </section>
      ) : null}
    </div>
  );
}
