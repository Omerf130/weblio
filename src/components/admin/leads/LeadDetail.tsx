"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AdminLeadDetailDto } from "@/types/lead";
import {
  formatLeadNumber,
  hasUtmData,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
} from "@/lib/leads/rules";
import {
  markLeadUnreadAction,
  saveLeadNotesAction,
  updateLeadStatusAction,
  type LeadNotesActionState,
} from "@/lib/leads/actions";
import { LEAD_STATUSES } from "@/lib/validations/lead";
import DeleteLeadButton from "./DeleteLeadButton";
import LeadStatusBadge from "./LeadStatusBadge";
import styles from "./LeadDetail.module.scss";

type LeadDetailProps = {
  lead: AdminLeadDetailDto;
  errorMessage?: string;
};

const notesInitialState: LeadNotesActionState = {};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function LeadDetail({ lead, errorMessage }: LeadDetailProps) {
  const [notesState, notesAction, notesPending] = useActionState(
    saveLeadNotesAction,
    notesInitialState
  );

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <Link href="/admin/leads" className={styles.backLink}>
            חזרה לרשימת פניות
          </Link>
          <h1 className={styles.title}>{formatLeadNumber(lead.leadNumber)}</h1>
        </div>
        <LeadStatusBadge status={lead.status} />
      </div>

      {errorMessage ? (
        <p className={styles.alert} role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className={styles.grid}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>פרטי הפנייה</h2>
          <dl className={styles.fieldList}>
            <div>
              <dt>שם</dt>
              <dd>{lead.name}</dd>
            </div>
            <div>
              <dt>טלפון</dt>
              <dd>{lead.phone}</dd>
            </div>
            <div>
              <dt>מייל</dt>
              <dd>{lead.email}</dd>
            </div>
            {lead.message ? (
              <div>
                <dt>הודעה</dt>
                <dd>{lead.message}</dd>
              </div>
            ) : null}
            <div>
              <dt>מקור</dt>
              <dd>{LEAD_SOURCE_LABELS[lead.source]}</dd>
            </div>
            <div>
              <dt>סטטוס שאלון</dt>
              <dd>
                {lead.qualificationStatus === "completed" ? "הושלם" : "ממתין"}
              </dd>
            </div>
            <div>
              <dt>עמוד מקור</dt>
              <dd>{lead.sourcePage}</dd>
            </div>
            {lead.campaign ? (
              <div>
                <dt>קמפיין</dt>
                <dd>{lead.campaign}</dd>
              </div>
            ) : null}
            <div>
              <dt>נוצר בתאריך</dt>
              <dd>{formatDate(lead.createdAt)}</dd>
            </div>
            {lead.lastContactAt ? (
              <div>
                <dt>נוצר קשר לאחרונה</dt>
                <dd>{formatDate(lead.lastContactAt)}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        {hasUtmData(lead) ? (
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>מקור קמפיין</h2>
            <dl className={styles.fieldList}>
              {lead.utm_source ? (
                <div>
                  <dt>utm_source</dt>
                  <dd>{lead.utm_source}</dd>
                </div>
              ) : null}
              {lead.utm_medium ? (
                <div>
                  <dt>utm_medium</dt>
                  <dd>{lead.utm_medium}</dd>
                </div>
              ) : null}
              {lead.utm_campaign ? (
                <div>
                  <dt>utm_campaign</dt>
                  <dd>{lead.utm_campaign}</dd>
                </div>
              ) : null}
              {lead.utm_content ? (
                <div>
                  <dt>utm_content</dt>
                  <dd>{lead.utm_content}</dd>
                </div>
              ) : null}
            </dl>
          </section>
        ) : null}

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>סטטוס</h2>
          <form action={updateLeadStatusAction} className={styles.statusForm}>
            <input type="hidden" name="id" value={lead.id} />
            <label htmlFor="lead-status">סטטוס פנייה</label>
            <select id="lead-status" name="status" defaultValue={lead.status}>
              {LEAD_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {LEAD_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            <button type="submit" className={styles.primaryButton}>
              עדכון סטטוס
            </button>
          </form>
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>הערות פנימיות</h2>
          <form action={notesAction} className={styles.notesForm}>
            <input type="hidden" name="id" value={lead.id} />
            <label htmlFor="lead-notes">הערות</label>
            <textarea
              id="lead-notes"
              name="internalNotes"
              defaultValue={lead.internalNotes}
              rows={6}
              disabled={notesPending}
            />
            {notesState.error ? (
              <p className={styles.alert} role="alert">
                {notesState.error}
              </p>
            ) : null}
            {notesState.saved ? (
              <p className={styles.success} role="status">
                ההערות נשמרו.
              </p>
            ) : null}
            <button type="submit" className={styles.primaryButton} disabled={notesPending}>
              {notesPending ? "שומר..." : "שמור הערות"}
            </button>
          </form>
        </section>

        {lead.qualification?.answers?.length ? (
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>שאלות המשך</h2>
            <ul className={styles.qualificationList}>
              {lead.qualification.answers.map((answer) => (
                <li key={answer.key}>
                  <p className={styles.question}>{answer.question}</p>
                  <p className={styles.answer}>{answer.answer}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <div className={styles.footerActions}>
        <form action={markLeadUnreadAction}>
          <input type="hidden" name="id" value={lead.id} />
          <button type="submit" className={styles.secondaryButton}>
            סמן כלא נקרא
          </button>
        </form>
        <DeleteLeadButton id={lead.id} label={formatLeadNumber(lead.leadNumber)} />
      </div>
    </section>
  );
}
