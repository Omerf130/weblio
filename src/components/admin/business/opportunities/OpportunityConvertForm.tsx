"use client";

import { useActionState } from "react";
import type { AdminOpportunityDetailDto } from "@/types/opportunity";
import {
  deriveOpportunityConversionName,
} from "@/lib/business/opportunities/conversion-mapping";
import type { ConvertOpportunityToLeadActionState } from "@/lib/business/opportunities/action-states";
import { convertOpportunityToLeadAction } from "@/lib/business/opportunities/actions";
import styles from "./OpportunityConvertForm.module.scss";

type OpportunityConvertFormProps = {
  opportunity: AdminOpportunityDetailDto;
  onCancel: () => void;
};

const initialState: ConvertOpportunityToLeadActionState = {};

export default function OpportunityConvertForm({
  opportunity,
  onCancel,
}: OpportunityConvertFormProps) {
  const [state, formAction, pending] = useActionState(
    convertOpportunityToLeadAction,
    initialState
  );

  const defaultName = deriveOpportunityConversionName(opportunity);

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>המרת הזדמנות לליד</h2>
      <p className={styles.subtitle}>
        בדקו ועדכנו את פרטי הליד לפני היצירה. נדרש שם ולפחות טלפון או מייל.
      </p>

      <form action={formAction} className={styles.form}>
        <input type="hidden" name="opportunityId" value={opportunity.id} />

        <div className={styles.field}>
          <label htmlFor="conv-name" className={styles.label}>
            שם *
          </label>
          <input
            id="conv-name"
            name="name"
            type="text"
            required
            maxLength={120}
            defaultValue={defaultName}
            className={styles.input}
            disabled={pending}
          />
        </div>

        <div className={styles.twoCol}>
          <div className={styles.field}>
            <label htmlFor="conv-phone" className={styles.label}>
              טלפון
            </label>
            <input
              id="conv-phone"
              name="phone"
              type="tel"
              maxLength={30}
              defaultValue={opportunity.phone ?? ""}
              className={styles.input}
              disabled={pending}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="conv-email" className={styles.label}>
              אימייל
            </label>
            <input
              id="conv-email"
              name="email"
              type="email"
              maxLength={254}
              defaultValue={opportunity.email ?? ""}
              className={styles.input}
              disabled={pending}
            />
          </div>
        </div>

        {state.error && (
          <p className={styles.error} role="alert">
            {state.error}
          </p>
        )}

        <div className={styles.buttonRow}>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={pending}
          >
            {pending ? "יוצר ליד..." : "צור ליד"}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onCancel}
            disabled={pending}
          >
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
}
