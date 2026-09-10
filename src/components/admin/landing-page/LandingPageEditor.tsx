"use client";

import { useActionState, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { BuildYourDreamContent } from "@/lib/content/build-your-dream/types";
import { isEditorContentDirty } from "@/lib/build-your-dream-landing/resolve-landing-image-update";
import {
  saveBuildYourDreamLandingAction,
  type BuildYourDreamLandingActionState,
} from "@/lib/build-your-dream-landing/actions";
import LandingPageImageField from "./LandingPageImageField";
import styles from "./LandingPageEditor.module.scss";

type LandingPageEditorProps = {
  initialContent: BuildYourDreamContent;
  lastSavedAt: string | null;
  isPersisted: boolean;
};

const SECTIONS = [
  { id: "seo", label: "SEO" },
  { id: "hero", label: "Hero" },
  { id: "benefits", label: "יתרונות" },
  { id: "split1", label: "Split 1" },
  { id: "process", label: "תהליך" },
  { id: "banner", label: "CTA Banner" },
  { id: "split2", label: "Split 2" },
  { id: "faq", label: "FAQ" },
  { id: "form", label: "טופס" },
  { id: "final", label: "CTA סיום" },
  { id: "thankyou", label: "Thank You" },
] as const;

const BENEFIT_ICONS = ["sparkles", "zap", "rocket", "heart", "star"] as const;

const LEAD_FORM_FIELD_KEYS = ["name", "phone", "email", "message"] as const;

const LEAD_FORM_FIELD_LABELS: Record<(typeof LEAD_FORM_FIELD_KEYS)[number], string> = {
  name: "שם מלא",
  phone: "טלפון",
  email: "מייל",
  message: "הודעה (אופציונלי)",
};

const initialActionState: BuildYourDreamLandingActionState = {};

function formatSavedAt(iso: string | null): string {
  if (!iso) {
    return "טרם נשמר";
  }

  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function cloneContent(content: BuildYourDreamContent): BuildYourDreamContent {
  return JSON.parse(JSON.stringify(content)) as BuildYourDreamContent;
}

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

type AccordionSectionProps = {
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

function AccordionSection({ id, title, open, onToggle, children }: AccordionSectionProps) {
  return (
    <section id={id} className={styles.section}>
      <button type="button" className={styles.sectionHeader} onClick={onToggle}>
        <span>{title}</span>
        <span aria-hidden>{open ? "−" : "+"}</span>
      </button>
      {open ? <div className={styles.sectionBody}>{children}</div> : null}
    </section>
  );
}

export default function LandingPageEditor({
  initialContent,
  lastSavedAt,
  isPersisted,
}: LandingPageEditorProps) {
  const [content, setContent] = useState<BuildYourDreamContent>(() =>
    cloneContent(initialContent)
  );
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify(cloneContent(initialContent))
  );
  const [savedAt, setSavedAt] = useState<string | null>(lastSavedAt);
  const [persisted, setPersisted] = useState(isPersisted);
  const [imageFieldsResetKey, setImageFieldsResetKey] = useState(0);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    seo: true,
    hero: true,
  });
  const [state, formAction, isPending] = useActionState(
    saveBuildYourDreamLandingAction,
    initialActionState
  );

  const isDirty = useMemo(
    () => isEditorContentDirty(JSON.stringify(content), savedSnapshot),
    [content, savedSnapshot]
  );

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (state.success && state.savedAt && state.content) {
      const savedContent = cloneContent(state.content);
      setContent(savedContent);
      setSavedSnapshot(JSON.stringify(savedContent));
      setSavedAt(state.savedAt);
      setPersisted(true);
      setImageFieldsResetKey((key) => key + 1);
    }
  }, [state.success, state.savedAt, state.content]);

  const toggleSection = useCallback((id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const scrollToSection = useCallback((id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: true }));
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const updateField = useCallback(
    <K extends keyof BuildYourDreamContent>(
      key: K,
      value: BuildYourDreamContent[K]
    ) => {
      setContent((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>עריכת דף נחיתה</h1>
          <p className={styles.meta}>
            {persisted ? `נשמר לאחרונה: ${formatSavedAt(savedAt)}` : "טרם נשמר — מוצג תוכן ברירת מחדל"}
          </p>
        </div>
      </header>

      {state.success ? <p className={styles.toast} role="status">התוכן נשמר בהצלחה</p> : null}
      {state.error ? (
        <p className={styles.formError} role="alert">
          {state.error}
        </p>
      ) : null}

      <form action={formAction} className={styles.editor}>
        <input type="hidden" name="contentJson" value={JSON.stringify(content)} readOnly />

        <AccordionSection
          id="seo"
          title="SEO"
          open={Boolean(openSections.seo)}
          onToggle={() => toggleSection("seo")}
        >
          <div className={styles.field}>
            <label className={styles.label} htmlFor="meta-title">כותרת עמוד</label>
            <input
              id="meta-title"
              className={styles.input}
              value={content.meta.title}
              disabled={isPending}
              onChange={(e) =>
                updateField("meta", { ...content.meta, title: e.target.value })
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="meta-description">תיאור מטא</label>
            <textarea
              id="meta-description"
              className={styles.textarea}
              value={content.meta.description}
              disabled={isPending}
              onChange={(e) =>
                updateField("meta", { ...content.meta, description: e.target.value })
              }
            />
          </div>
          <LandingPageImageField
            label="תמונת Open Graph"
            currentImageUrl={content.meta.ogImage?.src}
            fileInputName="ogImageFile"
            removeInputName="removeOgImage"
            resetKey={imageFieldsResetKey}
            disabled={isPending}
          />
        </AccordionSection>

        <AccordionSection
          id="hero"
          title="Hero"
          open={Boolean(openSections.hero)}
          onToggle={() => toggleSection("hero")}
        >
          <div className={styles.field}>
            <label className={styles.label} htmlFor="hero-eyebrow">Eyebrow</label>
            <input
              id="hero-eyebrow"
              className={styles.input}
              value={content.hero.eyebrow}
              disabled={isPending}
              onChange={(e) =>
                updateField("hero", { ...content.hero, eyebrow: e.target.value })
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="hero-title">כותרת ראשית</label>
            <input
              id="hero-title"
              className={styles.input}
              value={content.hero.title}
              disabled={isPending}
              onChange={(e) =>
                updateField("hero", { ...content.hero, title: e.target.value })
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="hero-subtitle">תת-כותרת</label>
            <textarea
              id="hero-subtitle"
              className={styles.textarea}
              value={content.hero.subtitle}
              disabled={isPending}
              onChange={(e) =>
                updateField("hero", { ...content.hero, subtitle: e.target.value })
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="hero-cta-primary">כפתור ראשי</label>
            <input
              id="hero-cta-primary"
              className={styles.input}
              value={content.hero.ctaPrimary.label}
              disabled={isPending}
              onChange={(e) =>
                updateField("hero", {
                  ...content.hero,
                  ctaPrimary: { ...content.hero.ctaPrimary, label: e.target.value },
                })
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="hero-cta-secondary">כפתור משני</label>
            <input
              id="hero-cta-secondary"
              className={styles.input}
              value={content.hero.ctaSecondary.label}
              disabled={isPending}
              onChange={(e) =>
                updateField("hero", {
                  ...content.hero,
                  ctaSecondary: { ...content.hero.ctaSecondary, label: e.target.value },
                })
              }
            />
          </div>
          <LandingPageImageField
            label="תמונת Hero"
            currentImageUrl={content.images.hero.src}
            fileInputName="heroImageFile"
            removeInputName="removeHeroImage"
            resetKey={imageFieldsResetKey}
            disabled={isPending}
          />
        </AccordionSection>

        <AccordionSection
          id="benefits"
          title="יתרונות"
          open={Boolean(openSections.benefits)}
          onToggle={() => toggleSection("benefits")}
        >
          <div className={styles.field}>
            <label className={styles.label} htmlFor="benefits-title">כותרת סקשן</label>
            <input
              id="benefits-title"
              className={styles.input}
              value={content.benefits.title}
              disabled={isPending}
              onChange={(e) =>
                updateField("benefits", { ...content.benefits, title: e.target.value })
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="benefits-subtitle">תת-כותרת</label>
            <textarea
              id="benefits-subtitle"
              className={styles.textarea}
              value={content.benefits.subtitle}
              disabled={isPending}
              onChange={(e) =>
                updateField("benefits", { ...content.benefits, subtitle: e.target.value })
              }
            />
          </div>
          {content.benefits.items.map((item, index) => (
            <div key={item.id} className={styles.listItem}>
              <div className={styles.field}>
                <label className={styles.label}>אייקון</label>
                <select
                  className={styles.select}
                  value={item.icon}
                  disabled={isPending}
                  onChange={(e) => {
                    const items = [...content.benefits.items];
                    items[index] = { ...item, icon: e.target.value };
                    updateField("benefits", { ...content.benefits, items });
                  }}
                >
                  {BENEFIT_ICONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>כותרת</label>
                <input
                  className={styles.input}
                  value={item.title}
                  disabled={isPending}
                  onChange={(e) => {
                    const items = [...content.benefits.items];
                    items[index] = { ...item, title: e.target.value };
                    updateField("benefits", { ...content.benefits, items });
                  }}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>טקסט</label>
                <textarea
                  className={styles.textarea}
                  value={item.text}
                  disabled={isPending}
                  onChange={(e) => {
                    const items = [...content.benefits.items];
                    items[index] = { ...item, text: e.target.value };
                    updateField("benefits", { ...content.benefits, items });
                  }}
                />
              </div>
              <div className={styles.listActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={isPending || index === 0}
                  onClick={() => {
                    const items = [...content.benefits.items];
                    [items[index - 1], items[index]] = [items[index], items[index - 1]];
                    updateField("benefits", { ...content.benefits, items });
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={isPending || index === content.benefits.items.length - 1}
                  onClick={() => {
                    const items = [...content.benefits.items];
                    [items[index], items[index + 1]] = [items[index + 1], items[index]];
                    updateField("benefits", { ...content.benefits, items });
                  }}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={isPending || content.benefits.items.length <= 1}
                  onClick={() => {
                    const items = content.benefits.items.filter((i) => i.id !== item.id);
                    updateField("benefits", { ...content.benefits, items });
                  }}
                >
                  מחק
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className={styles.addButton}
            disabled={isPending || content.benefits.items.length >= 8}
            onClick={() => {
              updateField("benefits", {
                ...content.benefits,
                items: [
                  ...content.benefits.items,
                  {
                    id: newId("benefit"),
                    icon: "star",
                    title: "כותרת חדשה",
                    text: "טקסט חדש",
                  },
                ],
              });
            }}
          >
            + הוסף כרטיס
          </button>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="benefits-cta">כפתור CTA בתחתית</label>
            <input
              id="benefits-cta"
              className={styles.input}
              value={content.benefits.cta.label}
              disabled={isPending}
              onChange={(e) =>
                updateField("benefits", {
                  ...content.benefits,
                  cta: { ...content.benefits.cta, label: e.target.value },
                })
              }
            />
          </div>
        </AccordionSection>

        <AccordionSection
          id="split1"
          title="Split 1"
          open={Boolean(openSections.split1)}
          onToggle={() => toggleSection("split1")}
        >
          <div className={styles.field}>
            <label className={styles.label}>כותרת</label>
            <input
              className={styles.input}
              value={content.splitPrimary.title}
              disabled={isPending}
              onChange={(e) =>
                updateField("splitPrimary", { ...content.splitPrimary, title: e.target.value })
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>טקסט</label>
            <textarea
              className={styles.textarea}
              value={content.splitPrimary.text}
              disabled={isPending}
              onChange={(e) =>
                updateField("splitPrimary", { ...content.splitPrimary, text: e.target.value })
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>כפתור</label>
            <input
              className={styles.input}
              value={content.splitPrimary.cta.label}
              disabled={isPending}
              onChange={(e) =>
                updateField("splitPrimary", {
                  ...content.splitPrimary,
                  cta: { ...content.splitPrimary.cta, label: e.target.value },
                })
              }
            />
          </div>
          <LandingPageImageField
            label="תמונה"
            currentImageUrl={content.images.splitPrimary.src}
            fileInputName="splitPrimaryImageFile"
            removeInputName="removeSplitPrimaryImage"
            resetKey={imageFieldsResetKey}
            disabled={isPending}
          />
        </AccordionSection>

        <AccordionSection
          id="process"
          title="תהליך"
          open={Boolean(openSections.process)}
          onToggle={() => toggleSection("process")}
        >
          <div className={styles.field}>
            <label className={styles.label}>כותרת סקשן</label>
            <input
              className={styles.input}
              value={content.process.title}
              disabled={isPending}
              onChange={(e) =>
                updateField("process", { ...content.process, title: e.target.value })
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="process-subtitle">תת-כותרת</label>
            <textarea
              id="process-subtitle"
              className={styles.textarea}
              value={content.process.subtitle}
              disabled={isPending}
              onChange={(e) =>
                updateField("process", { ...content.process, subtitle: e.target.value })
              }
            />
          </div>
          {content.process.steps.map((step, index) => (
            <div key={step.id} className={styles.listItem}>
              <div className={styles.field}>
                <label className={styles.label}>כותרת שלב {index + 1}</label>
                <input
                  className={styles.input}
                  value={step.title}
                  disabled={isPending}
                  onChange={(e) => {
                    const steps = [...content.process.steps];
                    steps[index] = { ...step, title: e.target.value };
                    updateField("process", { ...content.process, steps });
                  }}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>תיאור</label>
                <textarea
                  className={styles.textarea}
                  value={step.text}
                  disabled={isPending}
                  onChange={(e) => {
                    const steps = [...content.process.steps];
                    steps[index] = { ...step, text: e.target.value };
                    updateField("process", { ...content.process, steps });
                  }}
                />
              </div>
              <div className={styles.listActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={isPending || index === 0}
                  onClick={() => {
                    const steps = [...content.process.steps];
                    [steps[index - 1], steps[index]] = [steps[index], steps[index - 1]];
                    updateField("process", { ...content.process, steps });
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={isPending || index === content.process.steps.length - 1}
                  onClick={() => {
                    const steps = [...content.process.steps];
                    [steps[index], steps[index + 1]] = [steps[index + 1], steps[index]];
                    updateField("process", { ...content.process, steps });
                  }}
                >
                  ↓
                </button>
              </div>
            </div>
          ))}
        </AccordionSection>

        <AccordionSection
          id="banner"
          title="CTA Banner"
          open={Boolean(openSections.banner)}
          onToggle={() => toggleSection("banner")}
        >
          <div className={styles.field}>
            <label className={styles.label}>כותרת</label>
            <input
              className={styles.input}
              value={content.ctaBanner.title}
              disabled={isPending}
              onChange={(e) =>
                updateField("ctaBanner", { ...content.ctaBanner, title: e.target.value })
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>טקסט</label>
            <textarea
              className={styles.textarea}
              value={content.ctaBanner.text}
              disabled={isPending}
              onChange={(e) =>
                updateField("ctaBanner", { ...content.ctaBanner, text: e.target.value })
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>כפתור</label>
            <input
              className={styles.input}
              value={content.ctaBanner.cta.label}
              disabled={isPending}
              onChange={(e) =>
                updateField("ctaBanner", {
                  ...content.ctaBanner,
                  cta: { ...content.ctaBanner.cta, label: e.target.value },
                })
              }
            />
          </div>
        </AccordionSection>

        <AccordionSection
          id="split2"
          title="Split 2"
          open={Boolean(openSections.split2)}
          onToggle={() => toggleSection("split2")}
        >
          <div className={styles.field}>
            <label className={styles.label}>כותרת</label>
            <input
              className={styles.input}
              value={content.splitSecondary.title}
              disabled={isPending}
              onChange={(e) =>
                updateField("splitSecondary", { ...content.splitSecondary, title: e.target.value })
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>טקסט</label>
            <textarea
              className={styles.textarea}
              value={content.splitSecondary.text}
              disabled={isPending}
              onChange={(e) =>
                updateField("splitSecondary", { ...content.splitSecondary, text: e.target.value })
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>כפתור</label>
            <input
              className={styles.input}
              value={content.splitSecondary.cta.label}
              disabled={isPending}
              onChange={(e) =>
                updateField("splitSecondary", {
                  ...content.splitSecondary,
                  cta: { ...content.splitSecondary.cta, label: e.target.value },
                })
              }
            />
          </div>
          <LandingPageImageField
            label="תמונה"
            currentImageUrl={content.images.splitSecondary.src}
            fileInputName="splitSecondaryImageFile"
            removeInputName="removeSplitSecondaryImage"
            resetKey={imageFieldsResetKey}
            disabled={isPending}
          />
        </AccordionSection>

        <AccordionSection
          id="faq"
          title="FAQ"
          open={Boolean(openSections.faq)}
          onToggle={() => toggleSection("faq")}
        >
          <div className={styles.field}>
            <label className={styles.label}>כותרת סקשן</label>
            <input
              className={styles.input}
              value={content.faq.title}
              disabled={isPending}
              onChange={(e) => updateField("faq", { ...content.faq, title: e.target.value })}
            />
          </div>
          {content.faq.items.map((item, index) => (
            <div key={item.id} className={styles.listItem}>
              <div className={styles.field}>
                <label className={styles.label}>שאלה</label>
                <input
                  className={styles.input}
                  value={item.question}
                  disabled={isPending}
                  onChange={(e) => {
                    const items = [...content.faq.items];
                    items[index] = { ...item, question: e.target.value };
                    updateField("faq", { ...content.faq, items });
                  }}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>תשובה</label>
                <textarea
                  className={styles.textarea}
                  value={item.answer}
                  disabled={isPending}
                  onChange={(e) => {
                    const items = [...content.faq.items];
                    items[index] = { ...item, answer: e.target.value };
                    updateField("faq", { ...content.faq, items });
                  }}
                />
              </div>
              <div className={styles.listActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={isPending || index === 0}
                  onClick={() => {
                    const items = [...content.faq.items];
                    [items[index - 1], items[index]] = [items[index], items[index - 1]];
                    updateField("faq", { ...content.faq, items });
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={isPending || index === content.faq.items.length - 1}
                  onClick={() => {
                    const items = [...content.faq.items];
                    [items[index], items[index + 1]] = [items[index + 1], items[index]];
                    updateField("faq", { ...content.faq, items });
                  }}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={isPending || content.faq.items.length <= 1}
                  onClick={() => {
                    const items = content.faq.items.filter((i) => i.id !== item.id);
                    updateField("faq", { ...content.faq, items });
                  }}
                >
                  מחק
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className={styles.addButton}
            disabled={isPending || content.faq.items.length >= 20}
            onClick={() => {
              updateField("faq", {
                ...content.faq,
                items: [
                  ...content.faq.items,
                  { id: newId("faq"), question: "שאלה חדשה", answer: "תשובה חדשה" },
                ],
              });
            }}
          >
            + הוסף שאלה
          </button>
        </AccordionSection>

        <AccordionSection
          id="form"
          title="טופס לידים"
          open={Boolean(openSections.form)}
          onToggle={() => toggleSection("form")}
        >
          <div className={styles.field}>
            <label className={styles.label}>כותרת</label>
            <input
              className={styles.input}
              value={content.leadForm.title}
              disabled={isPending}
              onChange={(e) =>
                updateField("leadForm", { ...content.leadForm, title: e.target.value })
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>תת-כותרת</label>
            <textarea
              className={styles.textarea}
              value={content.leadForm.subtitle}
              disabled={isPending}
              onChange={(e) =>
                updateField("leadForm", { ...content.leadForm, subtitle: e.target.value })
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>טקסט כפתור שליחה</label>
            <input
              className={styles.input}
              value={content.leadForm.submitLabel}
              disabled={isPending}
              onChange={(e) =>
                updateField("leadForm", { ...content.leadForm, submitLabel: e.target.value })
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="lead-form-submitting-label">
              טקסט בזמן שליחה
            </label>
            <input
              id="lead-form-submitting-label"
              className={styles.input}
              value={content.leadForm.submittingLabel}
              disabled={isPending}
              onChange={(e) =>
                updateField("leadForm", {
                  ...content.leadForm,
                  submittingLabel: e.target.value,
                })
              }
            />
          </div>

          <p className={styles.subsectionTitle}>שדות הטופס</p>
          {LEAD_FORM_FIELD_KEYS.map((fieldKey) => (
            <div key={fieldKey} className={styles.listItem}>
              <p className={styles.label}>{LEAD_FORM_FIELD_LABELS[fieldKey]}</p>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`lead-form-${fieldKey}-label`}>
                  תווית
                </label>
                <input
                  id={`lead-form-${fieldKey}-label`}
                  className={styles.input}
                  value={content.leadForm.fields[fieldKey].label}
                  disabled={isPending}
                  onChange={(e) =>
                    updateField("leadForm", {
                      ...content.leadForm,
                      fields: {
                        ...content.leadForm.fields,
                        [fieldKey]: {
                          ...content.leadForm.fields[fieldKey],
                          label: e.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`lead-form-${fieldKey}-placeholder`}>
                  Placeholder
                </label>
                <input
                  id={`lead-form-${fieldKey}-placeholder`}
                  className={styles.input}
                  value={content.leadForm.fields[fieldKey].placeholder}
                  disabled={isPending}
                  onChange={(e) =>
                    updateField("leadForm", {
                      ...content.leadForm,
                      fields: {
                        ...content.leadForm.fields,
                        [fieldKey]: {
                          ...content.leadForm.fields[fieldKey],
                          placeholder: e.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
            </div>
          ))}
        </AccordionSection>

        <AccordionSection
          id="final"
          title="CTA סיום"
          open={Boolean(openSections.final)}
          onToggle={() => toggleSection("final")}
        >
          <div className={styles.field}>
            <label className={styles.label}>כותרת</label>
            <input
              className={styles.input}
              value={content.finalCta.title}
              disabled={isPending}
              onChange={(e) =>
                updateField("finalCta", { ...content.finalCta, title: e.target.value })
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>טקסט</label>
            <textarea
              className={styles.textarea}
              value={content.finalCta.text}
              disabled={isPending}
              onChange={(e) =>
                updateField("finalCta", { ...content.finalCta, text: e.target.value })
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>כפתור</label>
            <input
              className={styles.input}
              value={content.finalCta.cta.label}
              disabled={isPending}
              onChange={(e) =>
                updateField("finalCta", {
                  ...content.finalCta,
                  cta: { ...content.finalCta.cta, label: e.target.value },
                })
              }
            />
          </div>
        </AccordionSection>

        <AccordionSection
          id="thankyou"
          title="Thank You"
          open={Boolean(openSections.thankyou)}
          onToggle={() => toggleSection("thankyou")}
        >
          <div className={styles.field}>
            <label className={styles.label} htmlFor="thankyou-step-label">תווית שלב</label>
            <input
              id="thankyou-step-label"
              className={styles.input}
              value={content.thankYou.stepLabel}
              disabled={isPending}
              onChange={(e) =>
                updateField("thankYou", { ...content.thankYou, stepLabel: e.target.value })
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>כותרת</label>
            <input
              className={styles.input}
              value={content.thankYou.title}
              disabled={isPending}
              onChange={(e) =>
                updateField("thankYou", { ...content.thankYou, title: e.target.value })
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>תת-כותרת</label>
            <textarea
              className={styles.textarea}
              value={content.thankYou.subtitle}
              disabled={isPending}
              onChange={(e) =>
                updateField("thankYou", { ...content.thankYou, subtitle: e.target.value })
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>כותרת שלבים הבאים</label>
            <input
              className={styles.input}
              value={content.thankYou.nextStepsTitle}
              disabled={isPending}
              onChange={(e) =>
                updateField("thankYou", { ...content.thankYou, nextStepsTitle: e.target.value })
              }
            />
          </div>
          {content.thankYou.nextSteps.map((step, index) => (
            <div key={`step-${index}`} className={styles.listItem}>
              <div className={styles.field}>
                <label className={styles.label}>שלב {index + 1}</label>
                <input
                  className={styles.input}
                  value={step}
                  disabled={isPending}
                  onChange={(e) => {
                    const nextSteps = [...content.thankYou.nextSteps];
                    nextSteps[index] = e.target.value;
                    updateField("thankYou", { ...content.thankYou, nextSteps });
                  }}
                />
              </div>
              <div className={styles.listActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={isPending || index === 0}
                  onClick={() => {
                    const nextSteps = [...content.thankYou.nextSteps];
                    [nextSteps[index - 1], nextSteps[index]] = [
                      nextSteps[index],
                      nextSteps[index - 1],
                    ];
                    updateField("thankYou", { ...content.thankYou, nextSteps });
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={isPending || index === content.thankYou.nextSteps.length - 1}
                  onClick={() => {
                    const nextSteps = [...content.thankYou.nextSteps];
                    [nextSteps[index], nextSteps[index + 1]] = [
                      nextSteps[index + 1],
                      nextSteps[index],
                    ];
                    updateField("thankYou", { ...content.thankYou, nextSteps });
                  }}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={isPending || content.thankYou.nextSteps.length <= 1}
                  onClick={() => {
                    const nextSteps = content.thankYou.nextSteps.filter((_, i) => i !== index);
                    updateField("thankYou", { ...content.thankYou, nextSteps });
                  }}
                >
                  מחק
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className={styles.addButton}
            disabled={isPending || content.thankYou.nextSteps.length >= 10}
            onClick={() => {
              updateField("thankYou", {
                ...content.thankYou,
                nextSteps: [...content.thankYou.nextSteps, "שלב חדש"],
              });
            }}
          >
            + הוסף שלב
          </button>

          <div className={styles.field}>
            <label className={styles.label}>כותרת שאלון</label>
            <input
              className={styles.input}
              value={content.thankYou.qualification.title}
              disabled={isPending}
              onChange={(e) =>
                updateField("thankYou", {
                  ...content.thankYou,
                  qualification: {
                    ...content.thankYou.qualification,
                    title: e.target.value,
                  },
                })
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>תת-כותרת שאלון</label>
            <textarea
              className={styles.textarea}
              value={content.thankYou.qualification.subtitle}
              disabled={isPending}
              onChange={(e) =>
                updateField("thankYou", {
                  ...content.thankYou,
                  qualification: {
                    ...content.thankYou.qualification,
                    subtitle: e.target.value,
                  },
                })
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="thankyou-qualification-submit">
              טקסט כפתור שליחת שאלון
            </label>
            <input
              id="thankyou-qualification-submit"
              className={styles.input}
              value={content.thankYou.qualification.submitLabel}
              disabled={isPending}
              onChange={(e) =>
                updateField("thankYou", {
                  ...content.thankYou,
                  qualification: {
                    ...content.thankYou.qualification,
                    submitLabel: e.target.value,
                  },
                })
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="thankyou-qualification-submitting">
              טקסט בזמן שליחת שאלון
            </label>
            <input
              id="thankyou-qualification-submitting"
              className={styles.input}
              value={content.thankYou.qualification.submittingLabel}
              disabled={isPending}
              onChange={(e) =>
                updateField("thankYou", {
                  ...content.thankYou,
                  qualification: {
                    ...content.thankYou.qualification,
                    submittingLabel: e.target.value,
                  },
                })
              }
            />
          </div>

          {content.thankYou.qualification.questions.map((question, index) => (
            <div key={question.id} className={styles.listItem}>
              <div className={styles.field}>
                <label className={styles.label}>שאלה</label>
                <input
                  className={styles.input}
                  value={question.question}
                  disabled={isPending}
                  onChange={(e) => {
                    const questions = [...content.thankYou.qualification.questions];
                    questions[index] = { ...question, question: e.target.value };
                    updateField("thankYou", {
                      ...content.thankYou,
                      qualification: { ...content.thankYou.qualification, questions },
                    });
                  }}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Placeholder</label>
                <input
                  className={styles.input}
                  value={question.placeholder}
                  disabled={isPending}
                  onChange={(e) => {
                    const questions = [...content.thankYou.qualification.questions];
                    questions[index] = { ...question, placeholder: e.target.value };
                    updateField("thankYou", {
                      ...content.thankYou,
                      qualification: { ...content.thankYou.qualification, questions },
                    });
                  }}
                />
              </div>
              <label className={styles.label}>
                <input
                  type="checkbox"
                  checked={question.required}
                  disabled={isPending}
                  onChange={(e) => {
                    const questions = [...content.thankYou.qualification.questions];
                    questions[index] = { ...question, required: e.target.checked };
                    updateField("thankYou", {
                      ...content.thankYou,
                      qualification: { ...content.thankYou.qualification, questions },
                    });
                  }}
                />{" "}
                שדה חובה
              </label>
              <div className={styles.listActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={isPending || index === 0}
                  onClick={() => {
                    const questions = [...content.thankYou.qualification.questions];
                    [questions[index - 1], questions[index]] = [
                      questions[index],
                      questions[index - 1],
                    ];
                    updateField("thankYou", {
                      ...content.thankYou,
                      qualification: { ...content.thankYou.qualification, questions },
                    });
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={
                    isPending || index === content.thankYou.qualification.questions.length - 1
                  }
                  onClick={() => {
                    const questions = [...content.thankYou.qualification.questions];
                    [questions[index], questions[index + 1]] = [
                      questions[index + 1],
                      questions[index],
                    ];
                    updateField("thankYou", {
                      ...content.thankYou,
                      qualification: { ...content.thankYou.qualification, questions },
                    });
                  }}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={isPending || content.thankYou.qualification.questions.length <= 1}
                  onClick={() => {
                    const questions = content.thankYou.qualification.questions.filter(
                      (q) => q.id !== question.id
                    );
                    updateField("thankYou", {
                      ...content.thankYou,
                      qualification: { ...content.thankYou.qualification, questions },
                    });
                  }}
                >
                  מחק
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className={styles.addButton}
            disabled={isPending || content.thankYou.qualification.questions.length >= 10}
            onClick={() => {
              updateField("thankYou", {
                ...content.thankYou,
                qualification: {
                  ...content.thankYou.qualification,
                  questions: [
                    ...content.thankYou.qualification.questions,
                    {
                      id: newId("question"),
                      type: "text" as const,
                      question: "שאלה חדשה",
                      placeholder: "תשובה...",
                      required: true,
                    },
                  ],
                },
              });
            }}
          >
            + הוסף שאלת סינון
          </button>

          <p className={styles.subsectionTitle}>מסך השלמה</p>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="thankyou-completed-title">
              כותרת השלמה
            </label>
            <input
              id="thankyou-completed-title"
              className={styles.input}
              value={content.thankYou.completedTitle}
              disabled={isPending}
              onChange={(e) =>
                updateField("thankYou", {
                  ...content.thankYou,
                  completedTitle: e.target.value,
                })
              }
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="thankyou-completed-text">
              טקסט השלמה
            </label>
            <textarea
              id="thankyou-completed-text"
              className={styles.textarea}
              value={content.thankYou.completedText}
              disabled={isPending}
              onChange={(e) =>
                updateField("thankYou", {
                  ...content.thankYou,
                  completedText: e.target.value,
                })
              }
            />
          </div>
        </AccordionSection>

        <div className={styles.saveBar}>
          <div className={styles.saveBarInner}>
            <span className={styles.meta}>
              {isDirty ? "יש שינויים שלא נשמרו" : "הכל שמור"}
            </span>
            <div className={styles.saveActions}>
              <a
                href="/build-your-dream"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.previewLink}
              >
                תצוגה מקדימה
              </a>
              <button type="submit" className={styles.saveButton} disabled={isPending}>
                {isPending ? "שומר..." : "שמירה"}
              </button>
            </div>
          </div>
        </div>
      </form>

      <nav className={styles.sectionNav} aria-label="ניווט סקשנים">
        <p className={styles.navTitle}>סקשנים</p>
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            className={styles.navLink}
            onClick={() => scrollToSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
