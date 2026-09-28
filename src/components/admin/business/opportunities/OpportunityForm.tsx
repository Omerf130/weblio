"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AdminOpportunityDetailDto } from "@/types/opportunity";
import { OPPORTUNITY_CLASSIFICATIONS, OPPORTUNITY_SOURCES } from "@/types/opportunity";
import {
  OPPORTUNITY_CLASSIFICATION_LABELS,
  OPPORTUNITY_SOURCE_LABELS,
} from "@/lib/business/opportunities/rules";
import type { OpportunityActionState } from "@/lib/business/opportunities/action-states";
import {
  createOpportunityAction,
  updateOpportunityAction,
} from "@/lib/business/opportunities/actions";
import styles from "./OpportunityForm.module.scss";

type OpportunityFormProps = {
  editingOpportunity?: AdminOpportunityDetailDto;
  onClose?: () => void;
  redirectOnCreate?: boolean;
};

const initialState: OpportunityActionState = {};

export default function OpportunityForm({
  editingOpportunity,
  onClose,
  redirectOnCreate = false,
}: OpportunityFormProps) {
  const router = useRouter();
  const isEdit = !!editingOpportunity;
  const action = isEdit ? updateOpportunityAction : createOpportunityAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (!state.success) {
      return;
    }
    if (redirectOnCreate && state.opportunityId) {
      router.push(`/admin/business/opportunities/${state.opportunityId}`);
      return;
    }
    if (onClose) {
      onClose();
      router.refresh();
    }
  }, [state.success, state.opportunityId, redirectOnCreate, onClose, router]);

  const locked = editingOpportunity?.status === "converted";

  return (
    <div className={styles.formWrapper}>
      <h3 className={styles.formTitle}>
        {isEdit ? "עריכת הזדמנות" : "הזדמנות חדשה"}
      </h3>

      {locked && (
        <p className={styles.lockedNote} role="status">
          הזדמנות שהומרה לליד — לא ניתן לערוך.
        </p>
      )}

      <form action={formAction} className={styles.form}>
        {isEdit && (
          <input type="hidden" name="id" value={editingOpportunity.id} />
        )}

        <div className={styles.field}>
          <label htmlFor="opp-title" className={styles.label}>
            כותרת *
          </label>
          <input
            id="opp-title"
            name="title"
            type="text"
            required
            maxLength={200}
            defaultValue={editingOpportunity?.title ?? ""}
            className={styles.input}
            disabled={pending || locked}
          />
        </div>

        <div className={styles.twoCol}>
          <div className={styles.field}>
            <label htmlFor="opp-source" className={styles.label}>
              מקור *
            </label>
            <select
              id="opp-source"
              name="source"
              required
              defaultValue={editingOpportunity?.source ?? "manual"}
              className={styles.select}
              disabled={pending || locked}
            >
              {OPPORTUNITY_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {OPPORTUNITY_SOURCE_LABELS[source]}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="opp-classification" className={styles.label}>
              סיווג *
            </label>
            <select
              id="opp-classification"
              name="classification"
              required
              defaultValue={editingOpportunity?.classification ?? "possibleNeed"}
              className={styles.select}
              disabled={pending || locked}
            >
              {OPPORTUNITY_CLASSIFICATIONS.map((classification) => (
                <option key={classification} value={classification}>
                  {OPPORTUNITY_CLASSIFICATION_LABELS[classification]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.twoCol}>
          <div className={styles.field}>
            <label htmlFor="opp-business" className={styles.label}>
              שם העסק
            </label>
            <input
              id="opp-business"
              name="businessName"
              type="text"
              maxLength={200}
              defaultValue={editingOpportunity?.businessName ?? ""}
              className={styles.input}
              disabled={pending || locked}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="opp-contact" className={styles.label}>
              איש קשר
            </label>
            <input
              id="opp-contact"
              name="contactName"
              type="text"
              maxLength={120}
              defaultValue={editingOpportunity?.contactName ?? ""}
              className={styles.input}
              disabled={pending || locked}
            />
          </div>
        </div>

        <div className={styles.twoCol}>
          <div className={styles.field}>
            <label htmlFor="opp-phone" className={styles.label}>
              טלפון
            </label>
            <input
              id="opp-phone"
              name="phone"
              type="tel"
              maxLength={30}
              defaultValue={editingOpportunity?.phone ?? ""}
              className={styles.input}
              disabled={pending || locked}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="opp-email" className={styles.label}>
              אימייל
            </label>
            <input
              id="opp-email"
              name="email"
              type="email"
              maxLength={254}
              defaultValue={editingOpportunity?.email ?? ""}
              className={styles.input}
              disabled={pending || locked}
            />
          </div>
        </div>

        <div className={styles.twoCol}>
          <div className={styles.field}>
            <label htmlFor="opp-source-url" className={styles.label}>
              קישור למקור
            </label>
            <input
              id="opp-source-url"
              name="sourceUrl"
              type="url"
              placeholder="https://"
              maxLength={2048}
              defaultValue={editingOpportunity?.sourceUrl ?? ""}
              className={styles.input}
              disabled={pending || locked}
            />
            <span className={styles.hint}>חייב להתחיל ב-https://</span>
          </div>
          <div className={styles.field}>
            <label htmlFor="opp-platform" className={styles.label}>
              פלטפורמת מקור
            </label>
            <input
              id="opp-platform"
              name="sourcePlatform"
              type="text"
              maxLength={80}
              defaultValue={editingOpportunity?.sourcePlatform ?? ""}
              className={styles.input}
              disabled={pending || locked}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="opp-description" className={styles.label}>
            תיאור / אות שזוהה
          </label>
          <textarea
            id="opp-description"
            name="description"
            rows={3}
            maxLength={2000}
            defaultValue={editingOpportunity?.description ?? ""}
            className={styles.textarea}
            disabled={pending || locked}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="opp-relevance" className={styles.label}>
            למה זה רלוונטי
          </label>
          <textarea
            id="opp-relevance"
            name="relevanceNote"
            rows={2}
            maxLength={2000}
            defaultValue={editingOpportunity?.relevanceNote ?? ""}
            className={styles.textarea}
            disabled={pending || locked}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="opp-internal" className={styles.label}>
            הערות פנימיות
          </label>
          <textarea
            id="opp-internal"
            name="internalNotes"
            rows={3}
            maxLength={5000}
            defaultValue={editingOpportunity?.internalNotes ?? ""}
            className={styles.textarea}
            disabled={pending || locked}
          />
        </div>

        {state.error && (
          <p className={styles.error} role="alert">
            {state.error}
          </p>
        )}

        {!locked && (
          <div className={styles.buttonRow}>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={pending}
            >
              {pending ? "שומר..." : isEdit ? "עדכון" : "יצירה"}
            </button>
            {onClose && (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={onClose}
                disabled={pending}
              >
                ביטול
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
