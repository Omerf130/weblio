"use client";

import { useState } from "react";
import { deleteLeadAction } from "@/lib/leads/actions";
import styles from "./LeadsList.module.scss";

type DeleteLeadButtonProps = {
  id: string;
  label: string;
};

export default function DeleteLeadButton({ id, label }: DeleteLeadButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isConfirming) {
    return (
      <button
        type="button"
        className={styles.dangerButton}
        onClick={() => setIsConfirming(true)}
      >
        מחיקה
      </button>
    );
  }

  return (
    <form action={deleteLeadAction} className={styles.actions}>
      <input type="hidden" name="id" value={id} />
      <span>למחוק את {label}?</span>
      <button type="submit" className={styles.dangerButton}>
        אישור מחיקה
      </button>
      <button
        type="button"
        className={styles.linkButton}
        onClick={() => setIsConfirming(false)}
      >
        ביטול
      </button>
    </form>
  );
}
