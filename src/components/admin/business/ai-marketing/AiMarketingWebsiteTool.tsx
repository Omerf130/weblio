"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  applyAiMarketingWebsiteContentAction,
  generateMarketingDraftAction,
} from "@/lib/business/ai-marketing/actions";
import type { AiMarketingProjectPickerOption } from "@/lib/business/ai-marketing/project-picker-options";
import { findPickerOptionById } from "@/lib/business/ai-marketing/project-picker-options";
import { THIN_PROJECT_CONTEXT_NOTICE } from "@/lib/business/ai-marketing/project-context-hints";
import { buildWebsiteProjectPurposeInput } from "@/lib/business/ai-marketing/marketing-input-builders";
import {
  commitTechnologiesInput,
  formatTechnologiesForInput,
} from "@/lib/business/ai-marketing/technologies-input";
import type { WebsiteProjectContentFields } from "@/lib/business/ai-marketing/types";
import { MAX_MARKETING_USER_INSTRUCTION_CHARS } from "@/lib/business/ai-marketing/validations";
import AiMarketingProjectSelectField from "./AiMarketingProjectSelectField";
import AiMarketingWebsiteApplyConfirm from "./AiMarketingWebsiteApplyConfirm";
import styles from "./AiMarketingTools.module.scss";

const INSTRUCTION_ID = "ai-marketing-website-instruction";

type AiMarketingWebsiteToolProps = {
  projects: AiMarketingProjectPickerOption[];
  onBack: () => void;
};

function emptyWebsiteFields(): WebsiteProjectContentFields {
  return {
    title: "",
    subtitle: "",
    description: "",
    homeTitle: "",
    homeSubtitle: "",
    technologies: [],
  };
}

function fieldsForApply(
  fields: WebsiteProjectContentFields,
  technologiesInput: string
): WebsiteProjectContentFields {
  const { technologies } = commitTechnologiesInput(technologiesInput);
  return {
    title: fields.title,
    subtitle: fields.subtitle,
    description: fields.description?.trim() || undefined,
    homeTitle: fields.homeTitle?.trim() || undefined,
    homeSubtitle: fields.homeSubtitle?.trim() || undefined,
    technologies,
  };
}

export default function AiMarketingWebsiteTool({
  projects,
  onBack,
}: AiMarketingWebsiteToolProps) {
  const [projectId, setProjectId] = useState("");
  const [draftProjectId, setDraftProjectId] = useState<string | null>(null);
  const [userInstruction, setUserInstruction] = useState("");
  const [fields, setFields] = useState<WebsiteProjectContentFields>(
    emptyWebsiteFields()
  );
  const [hasDraft, setHasDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [technologiesInput, setTechnologiesInput] = useState("");

  const selected = useMemo(
    () => findPickerOptionById(projects, projectId),
    [projects, projectId]
  );

  const draftMatchesProject =
    hasDraft && draftProjectId !== null && draftProjectId === projectId;

  const showThinNotice = selected?.thinContext ?? false;

  const canGenerate =
    Boolean(projectId) &&
    findPickerOptionById(projects, projectId) !== undefined &&
    !isGenerating &&
    !isApplying;

  const clearDraft = useCallback(() => {
    setHasDraft(false);
    setDraftProjectId(null);
    setFields(emptyWebsiteFields());
    setTechnologiesInput("");
    setApplySuccess(false);
    setShowApplyConfirm(false);
  }, []);

  const syncTechnologiesFromInput = useCallback(() => {
    const committed = commitTechnologiesInput(technologiesInput);
    setTechnologiesInput(committed.text);
    setFields((prev) => ({ ...prev, technologies: committed.technologies }));
    return committed.technologies;
  }, [technologiesInput]);

  const handleProjectChange = (id: string) => {
    if (id !== projectId) {
      clearDraft();
    }
    setProjectId(id);
    setError(null);
  };

  const runGeneration = useCallback(async () => {
    if (!canGenerate) {
      setError("בחר פרויקט מהרשימה.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setApplySuccess(false);

    const payload = buildWebsiteProjectPurposeInput({
      projectId,
      userInstruction: userInstruction.trim() || undefined,
    });

    try {
      const result = await generateMarketingDraftAction(payload);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.websiteContent) {
        setFields(result.websiteContent);
        setTechnologiesInput(
          formatTechnologiesForInput(result.websiteContent.technologies)
        );
        setHasDraft(true);
        setDraftProjectId(projectId);
        return;
      }

      setError("לא התקבל תוכן לאתר. נסה שוב.");
    } catch {
      setError("לא ניתן ליצור טיוטה כרגע.");
    } finally {
      setIsGenerating(false);
    }
  }, [canGenerate, projectId, userInstruction]);

  const runApply = useCallback(async () => {
    if (!draftMatchesProject || !projectId || !selected) {
      setError("הטיוטה לא שייכת לפרויקט שנבחר. צור טיוטה מחדש.");
      setShowApplyConfirm(false);
      return;
    }

    setIsApplying(true);
    setError(null);

    const committedTech = syncTechnologiesFromInput();

    try {
      const result = await applyAiMarketingWebsiteContentAction({
        projectId,
        fields: fieldsForApply(
          { ...fields, technologies: committedTech },
          technologiesInput
        ),
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.success) {
        setApplySuccess(true);
        setShowApplyConfirm(false);
      }
    } catch {
      setError("לא ניתן לעדכן את הפרויקט כרגע.");
    } finally {
      setIsApplying(false);
    }
  }, [
    draftMatchesProject,
    projectId,
    selected,
    fields,
    technologiesInput,
    syncTechnologiesFromInput,
  ]);

  const updateField = (
    key: keyof WebsiteProjectContentFields,
    value: string
  ) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setApplySuccess(false);
  };

  if (projects.length === 0) {
    return (
      <section className={styles.panel}>
        <button type="button" className={styles.backButton} onClick={onBack}>
          ← חזרה
        </button>
        <p className={styles.emptyState}>אין פרויקטים זמינים.</p>
      </section>
    );
  }

  return (
    <div className={styles.workspace}>
      <section className={styles.panel}>
        <button type="button" className={styles.backButton} onClick={onBack}>
          ← חזרה
        </button>
        <h2 className={styles.sectionTitle}>תוכן לאתר</h2>
        <p className={styles.sectionHint}>
          טיוטה לשדות הפרויקט באתר. ערוך ובדוק, ואז החל לפרויקט.
        </p>

        <AiMarketingProjectSelectField
          projects={projects}
          projectId={projectId}
          onProjectIdChange={handleProjectChange}
          disabled={isGenerating || isApplying}
        />

        {showThinNotice ? (
          <p className={styles.notice} role="status">
            {THIN_PROJECT_CONTEXT_NOTICE}
          </p>
        ) : null}

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
            disabled={isGenerating || isApplying}
            placeholder="למשל: תדגיש את העיצוב הרספונסיבי…"
          />
        </div>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        {applySuccess ? (
          <p className={styles.success} role="status">
            התוכן עודכן בפרויקט בהצלחה.
            {projectId ? (
              <>
                {" "}
                <Link
                  href={`/admin/projects/${projectId}`}
                  className={styles.inlineLink}
                >
                  פתח את הפרויקט
                </Link>
              </>
            ) : null}
          </p>
        ) : null}

        {isGenerating ? (
          <p className={styles.loadingHint} role="status" aria-live="polite">
            יוצר טיוטה… זה עשוי לקחת כמה שניות.
          </p>
        ) : null}

        {isApplying ? (
          <p className={styles.loadingHint} role="status" aria-live="polite">
            מעדכן את הפרויקט…
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

      {draftMatchesProject ? (
        <section className={styles.resultPanel} aria-labelledby="website-draft">
          <h2 id="website-draft" className={styles.sectionTitle}>
            טיוטת תוכן לאתר
          </h2>
          <p className={styles.sectionHint}>
            ערוך את השדות. לחיצה על «החל תוכן בפרויקט» תשמור את מה שמופיע כאן
            (לא את הטיוטה המקורית של ה-AI).
          </p>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="wc-title">
              כותרת
            </label>
            <input
              id="wc-title"
              className={styles.input}
              maxLength={120}
              value={fields.title}
              onChange={(e) => updateField("title", e.target.value)}
              disabled={isGenerating || isApplying}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="wc-subtitle">
              תת-כותרת
            </label>
            <input
              id="wc-subtitle"
              className={styles.input}
              maxLength={200}
              value={fields.subtitle}
              onChange={(e) => updateField("subtitle", e.target.value)}
              disabled={isGenerating || isApplying}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="wc-description">
              תיאור קצר
            </label>
            <textarea
              id="wc-description"
              className={styles.textarea}
              rows={3}
              maxLength={300}
              value={fields.description ?? ""}
              onChange={(e) => updateField("description", e.target.value)}
              disabled={isGenerating || isApplying}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="wc-home-title">
              כותרת לדף הבית (אופציונלי)
            </label>
            <input
              id="wc-home-title"
              className={styles.input}
              maxLength={120}
              value={fields.homeTitle ?? ""}
              onChange={(e) => updateField("homeTitle", e.target.value)}
              disabled={isGenerating || isApplying}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="wc-home-subtitle">
              תת-כותרת לדף הבית (אופציונלי)
            </label>
            <input
              id="wc-home-subtitle"
              className={styles.input}
              maxLength={200}
              value={fields.homeSubtitle ?? ""}
              onChange={(e) => updateField("homeSubtitle", e.target.value)}
              disabled={isGenerating || isApplying}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="wc-technologies">
              טכנולוגיות (מופרדות בפסיק)
            </label>
            <p className={styles.sectionHint}>
              הצעות מה-AI לסקירה בלבד. יישמרו רק לאחר «החל תוכן בפרויקט».
            </p>
            <input
              id="wc-technologies"
              className={styles.input}
              value={technologiesInput}
              onChange={(e) => {
                setApplySuccess(false);
                setTechnologiesInput(e.target.value);
              }}
              onBlur={() => {
                syncTechnologiesFromInput();
              }}
              disabled={isGenerating || isApplying}
              placeholder="Next.js, TypeScript, CMS, Responsive"
            />
          </div>

          <div className={styles.resultActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => {
                syncTechnologiesFromInput();
                setShowApplyConfirm(true);
              }}
              disabled={!fields.title.trim() || isGenerating || isApplying}
            >
              החל תוכן בפרויקט
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
        </section>
      ) : null}

      {showApplyConfirm && selected && draftMatchesProject ? (
        <AiMarketingWebsiteApplyConfirm
          projectLabel={selected.label}
          fields={fields}
          isApplying={isApplying}
          onCancel={() => {
            if (!isApplying) {
              setShowApplyConfirm(false);
            }
          }}
          onConfirm={() => void runApply()}
        />
      ) : null}
    </div>
  );
}
