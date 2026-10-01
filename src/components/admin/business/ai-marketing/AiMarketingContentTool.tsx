"use client";

import { useCallback, useState } from "react";
import { generateMarketingDraftAction } from "@/lib/business/ai-marketing/actions";
import {
  buildFreeTopicContentPurposeInput,
  buildProjectContentPurposeInput,
  type ProjectContentPurpose,
} from "@/lib/business/ai-marketing/marketing-input-builders";
import type { AiMarketingProjectPickerOption } from "@/lib/business/ai-marketing/project-picker-options";
import { findPickerOptionById } from "@/lib/business/ai-marketing/project-picker-options";
import { MARKETING_HUB_PURPOSE_CARDS } from "@/lib/business/ai-marketing/purpose-ui";
import { MAX_MARKETING_USER_INSTRUCTION_CHARS } from "@/lib/business/ai-marketing/validations";
import AiMarketingContentResultPanel from "./AiMarketingContentResultPanel";
import AiMarketingProjectSelectField from "./AiMarketingProjectSelectField";
import AiMarketingSourceSwitch, {
  type AiMarketingSourceMode,
} from "./AiMarketingSourceSwitch";
import styles from "./AiMarketingTools.module.scss";

const INSTRUCTION_ID = "ai-marketing-content-instruction";
const TOPIC_ID = "ai-marketing-content-topic";
const RESULT_ID = "ai-marketing-content-result";

type AiMarketingContentToolProps = {
  purpose: ProjectContentPurpose;
  projects: AiMarketingProjectPickerOption[];
  onBack: () => void;
};

function getToolMeta(purpose: ProjectContentPurpose) {
  return MARKETING_HUB_PURPOSE_CARDS.find((c) => c.purpose === purpose);
}

export default function AiMarketingContentTool({
  purpose,
  projects,
  onBack,
}: AiMarketingContentToolProps) {
  const meta = getToolMeta(purpose);
  const [sourceMode, setSourceMode] = useState<AiMarketingSourceMode>("project");
  const [projectId, setProjectId] = useState("");
  const [userInstruction, setUserInstruction] = useState("");
  const [freeTopic, setFreeTopic] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [resultSourceMode, setResultSourceMode] =
    useState<AiMarketingSourceMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "failed">(
    "idle"
  );

  const clearResult = useCallback(() => {
    setDraftContent("");
    setResultSourceMode(null);
    setCopyStatus("idle");
  }, []);

  const handleSourceModeChange = (mode: AiMarketingSourceMode) => {
    if (mode !== sourceMode) {
      clearResult();
      setError(null);
    }
    setSourceMode(mode);
  };

  const canGenerateProject =
    sourceMode === "project" &&
    Boolean(projectId) &&
    findPickerOptionById(projects, projectId) !== undefined &&
    !isGenerating;

  const canGenerateFreeTopic =
    sourceMode === "freeTopic" &&
    freeTopic.trim().length > 0 &&
    !isGenerating;

  const canGenerate = canGenerateProject || canGenerateFreeTopic;

  const runGeneration = useCallback(async () => {
    if (sourceMode === "project") {
      if (!projectId || !findPickerOptionById(projects, projectId)) {
        setError("בחר פרויקט מהרשימה.");
        return;
      }
    } else if (!freeTopic.trim()) {
      setError("כתוב על מה תרצה לכתוב.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setCopyStatus("idle");

    const payload =
      sourceMode === "project"
        ? buildProjectContentPurposeInput({
            purpose,
            projectId,
            userInstruction: userInstruction.trim() || undefined,
          })
        : buildFreeTopicContentPurposeInput({
            purpose,
            topic: freeTopic,
          });

    try {
      const result = await generateMarketingDraftAction(payload);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.content) {
        setDraftContent(result.content);
        setResultSourceMode(sourceMode);
        return;
      }

      setError("לא התקבלה טיוטה. נסה שוב.");
    } catch {
      setError("לא ניתן ליצור טיוטה כרגע.");
    } finally {
      setIsGenerating(false);
    }
  }, [
    sourceMode,
    projectId,
    purpose,
    userInstruction,
    freeTopic,
    projects,
  ]);

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
  const staleResult =
    resultSourceMode !== null && resultSourceMode !== sourceMode;

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

        <AiMarketingSourceSwitch
          value={sourceMode}
          onChange={handleSourceModeChange}
          disabled={isGenerating}
        />

        {sourceMode === "project" ? (
          <>
            <AiMarketingProjectSelectField
              projects={projects}
              projectId={projectId}
              onProjectIdChange={(id) => {
                setProjectId(id);
                setError(null);
                clearResult();
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
          </>
        ) : (
          <div className={styles.field}>
            <label htmlFor={TOPIC_ID} className={styles.label}>
              על מה תרצה לכתוב?
            </label>
            <textarea
              id={TOPIC_ID}
              className={styles.textarea}
              rows={4}
              maxLength={MAX_MARKETING_USER_INSTRUCTION_CHARS}
              value={freeTopic}
              onChange={(event) => {
                setFreeTopic(event.target.value);
                setError(null);
              }}
              disabled={isGenerating}
              placeholder="נושא מוכן, או: אין לי רעיון - תמצא נושא לפוסט על בניית אתרים לעסקים"
            />
          </div>
        )}

        {staleResult ? (
          <p className={styles.notice} role="status">
            שינית מקור - צור טיוטה מחדש לפני שימוש בתוצאה הקודמת.
          </p>
        ) : null}

        {isGenerating ? (
          <p className={styles.loadingHint} role="status" aria-live="polite">
            יוצר טיוטה… זה עשוי לקחת כמה שניות.
          </p>
        ) : null}

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

      <AiMarketingContentResultPanel
        resultId={RESULT_ID}
        content={draftContent}
        onContentChange={setDraftContent}
        isGenerating={isGenerating}
        onCopy={() => void handleCopy()}
        onRegenerate={() => void runGeneration()}
        canRegenerate={canGenerate && !staleResult}
        copyStatus={copyStatus}
        visible={Boolean(draftContent) && !staleResult}
      />
    </div>
  );
}
