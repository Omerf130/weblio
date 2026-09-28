"use client";

import { useActionState, useEffect } from "react";
import type { AdminFollowUpDto } from "@/types/follow-up";
import type { LeadSummary } from "@/lib/data/leads";
import type { OpportunitySummary } from "@/types/opportunity";
import Link from "next/link";
import type { FollowUpActionState } from "@/lib/business/follow-ups/action-states";
import {
  createFollowUpAction,
  editFollowUpAction,
} from "@/lib/business/follow-ups/actions";
import styles from "./FollowUpForm.module.scss";

type FollowUpFormProps = {
  editingFollowUp?: AdminFollowUpDto;
  leadOptions: LeadSummary[];
  opportunityOptions?: OpportunitySummary[];
  preselectedLeadId?: string;
  preselectedOpportunityId?: string;
  preselectedOpportunity?: OpportunitySummary;
  onClose: () => void;
};

const initialState: FollowUpActionState = {};

function toDateValue(iso: string): string {
  const d = new Date(iso);
  const year = d.toLocaleString("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric" });
  const month = d.toLocaleString("en-CA", { timeZone: "Asia/Jerusalem", month: "2-digit" });
  const day = d.toLocaleString("en-CA", { timeZone: "Asia/Jerusalem", day: "2-digit" });
  return `${year}-${month}-${day}`;
}

function toTimeValue(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jerusalem",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export default function FollowUpForm({
  editingFollowUp,
  leadOptions,
  opportunityOptions = [],
  preselectedLeadId,
  preselectedOpportunityId,
  preselectedOpportunity,
  onClose,
}: FollowUpFormProps) {
  const isEdit = !!editingFollowUp;
  const lockLead = !!preselectedLeadId && !isEdit;
  const lockOpportunity =
    (!!preselectedOpportunityId || !!preselectedOpportunity) && !isEdit;
  const action = isEdit ? editFollowUpAction : createFollowUpAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  const defaultDate = editingFollowUp
    ? toDateValue(editingFollowUp.dueAt)
    : "";
  const defaultTime = editingFollowUp
    ? toTimeValue(editingFollowUp.dueAt)
    : "09:00";

  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  function handleSubmit(formData: FormData) {
    const date = formData.get("_date") as string;
    const time = formData.get("_time") as string;

    if (date && time) {
      formData.set("dueAt", `${date}T${time}:00`);
    } else if (date) {
      formData.set("dueAt", `${date}T09:00:00`);
    }

    formData.delete("_date");
    formData.delete("_time");

    formAction(formData);
  }

  return (
    <div className={styles.formWrapper}>
      <h3 className={styles.formTitle}>
        {isEdit ? "עריכת מעקב" : "מעקב חדש"}
      </h3>

      <form action={handleSubmit} className={styles.form}>
        {isEdit && (
          <input type="hidden" name="id" value={editingFollowUp.id} />
        )}

        <div className={styles.field}>
          <label htmlFor="fu-title" className={styles.label}>
            כותרת
          </label>
          <input
            id="fu-title"
            name="title"
            type="text"
            required
            maxLength={200}
            defaultValue={editingFollowUp?.title ?? ""}
            className={styles.input}
            disabled={pending}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="fu-note" className={styles.label}>
            הערה
          </label>
          <textarea
            id="fu-note"
            name="note"
            rows={3}
            maxLength={2000}
            defaultValue={editingFollowUp?.note ?? ""}
            className={styles.textarea}
            disabled={pending}
          />
        </div>

        <div className={styles.dateTimeRow}>
          <div className={styles.field}>
            <label htmlFor="fu-date" className={styles.label}>
              תאריך
            </label>
            <input
              id="fu-date"
              name="_date"
              type="date"
              required
              defaultValue={defaultDate}
              className={styles.input}
              disabled={pending}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="fu-time" className={styles.label}>
              שעה
            </label>
            <input
              id="fu-time"
              name="_time"
              type="time"
              defaultValue={defaultTime}
              className={styles.input}
              disabled={pending}
            />
          </div>
        </div>

        {!isEdit && lockOpportunity && (preselectedOpportunityId ?? preselectedOpportunity?.id) && (
          <>
            <input
              type="hidden"
              name="opportunityId"
              value={preselectedOpportunityId ?? preselectedOpportunity!.id}
            />
            <div className={styles.field}>
              <span className={styles.label}>הזדמנות</span>
              <p className={styles.preselectedRelation}>
                {preselectedOpportunity?.title ?? "הזדמנות מקושרת"}
                {preselectedOpportunity?.businessName
                  ? ` · ${preselectedOpportunity.businessName}`
                  : ""}
                {" · "}
                <Link
                  href={`/admin/business/opportunities/${preselectedOpportunityId ?? preselectedOpportunity!.id}`}
                  className={styles.relationLink}
                >
                  צפייה
                </Link>
              </p>
            </div>
          </>
        )}

        {!isEdit && !lockOpportunity && !lockLead && (
          <>
            <div className={styles.field}>
              <label htmlFor="fu-lead" className={styles.label}>
                ליד (אופציונלי)
              </label>
              <select
                id="fu-lead"
                name="leadId"
                defaultValue={preselectedLeadId ?? ""}
                className={styles.select}
                disabled={pending}
              >
                <option value="">ללא</option>
                {leadOptions.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    #{lead.leadNumber} — {lead.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="fu-opportunity" className={styles.label}>
                הזדמנות (אופציונלי)
              </label>
              <select
                id="fu-opportunity"
                name="opportunityId"
                defaultValue=""
                className={styles.select}
                disabled={pending}
              >
                <option value="">ללא</option>
                {opportunityOptions.map((opp) => (
                  <option key={opp.id} value={opp.id}>
                    {opp.title}
                    {opp.businessName ? ` · ${opp.businessName}` : ""}
                  </option>
                ))}
              </select>
              <span className={styles.fieldHint}>
                ניתן לקשר לליד או להזדמנות — לא לשניהם יחד.
              </span>
            </div>
          </>
        )}

        {!isEdit && lockLead && preselectedLeadId && (
          <>
            <input type="hidden" name="leadId" value={preselectedLeadId} />
            <div className={styles.field}>
              <span className={styles.label}>ליד</span>
              <p className={styles.preselectedRelation}>
                ליד נבחר מראש ·{" "}
                <Link href={`/admin/leads/${preselectedLeadId}`} className={styles.relationLink}>
                  צפייה
                </Link>
              </p>
            </div>
          </>
        )}

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
            {pending ? "שומר..." : isEdit ? "עדכון" : "יצירה"}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onClose}
            disabled={pending}
          >
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
}
