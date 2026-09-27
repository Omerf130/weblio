"use client";

import { useState } from "react";
import Link from "next/link";
import type { AdminFollowUpDto } from "@/types/follow-up";
import type { LeadSummary } from "@/lib/data/leads";
import {
  completeFollowUpAction,
  cancelFollowUpAction,
  reopenFollowUpAction,
  deleteFollowUpAction,
} from "@/lib/business/follow-ups/actions";
import FollowUpStatusBadge from "./FollowUpStatusBadge";
import styles from "./FollowUpItem.module.scss";

type FollowUpItemProps = {
  followUp: AdminFollowUpDto;
  leadSummary?: LeadSummary;
  onEdit: (followUp: AdminFollowUpDto) => void;
};

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function isOverdue(followUp: AdminFollowUpDto): boolean {
  return followUp.status === "pending" && new Date(followUp.dueAt) < new Date();
}

export default function FollowUpItem({ followUp, leadSummary, onEdit }: FollowUpItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const overdue = isOverdue(followUp);

  return (
    <li className={`${styles.item} ${overdue ? styles.itemOverdue : ""}`}>
      <div className={styles.content}>
        <div className={styles.topRow}>
          <h3 className={styles.title}>{followUp.title}</h3>
          <FollowUpStatusBadge status={followUp.status} />
        </div>

        {followUp.note && (
          <p className={styles.note}>
            {followUp.note.length > 120
              ? `${followUp.note.slice(0, 120)}…`
              : followUp.note}
          </p>
        )}

        <div className={styles.meta}>
          <span className={overdue ? styles.dateOverdue : styles.date}>
            {formatDateTime(followUp.dueAt)}
            {overdue && " — באיחור"}
          </span>

          {leadSummary && (
            <Link
              href={`/admin/leads/${leadSummary.id}`}
              className={styles.leadLink}
            >
              #{leadSummary.leadNumber} — {leadSummary.name}
            </Link>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        {followUp.status === "pending" && (
          <>
            <form action={completeFollowUpAction}>
              <input type="hidden" name="id" value={followUp.id} />
              <button type="submit" className={styles.actionButton}>
                הושלם
              </button>
            </form>
            <button
              type="button"
              className={styles.actionButton}
              onClick={() => onEdit(followUp)}
            >
              עריכה
            </button>
            <form action={cancelFollowUpAction}>
              <input type="hidden" name="id" value={followUp.id} />
              <button type="submit" className={styles.actionButtonMuted}>
                ביטול
              </button>
            </form>
          </>
        )}

        {followUp.status === "completed" && (
          <form action={reopenFollowUpAction}>
            <input type="hidden" name="id" value={followUp.id} />
            <button type="submit" className={styles.actionButton}>
              פתח מחדש
            </button>
          </form>
        )}

        {followUp.status === "cancelled" && (
          <form action={reopenFollowUpAction}>
            <input type="hidden" name="id" value={followUp.id} />
            <button type="submit" className={styles.actionButton}>
              פתח מחדש
            </button>
          </form>
        )}

        {!confirmDelete ? (
          <button
            type="button"
            className={styles.dangerButton}
            onClick={() => setConfirmDelete(true)}
          >
            מחיקה
          </button>
        ) : (
          <form action={deleteFollowUpAction} className={styles.confirmDelete}>
            <input type="hidden" name="id" value={followUp.id} />
            <span className={styles.confirmText}>בטוח?</span>
            <button type="submit" className={styles.dangerButton}>
              כן, מחק
            </button>
            <button
              type="button"
              className={styles.actionButton}
              onClick={() => setConfirmDelete(false)}
            >
              ביטול
            </button>
          </form>
        )}
      </div>
    </li>
  );
}
