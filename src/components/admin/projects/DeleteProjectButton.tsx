"use client";

import { useState } from "react";
import { deleteProjectAction } from "@/lib/projects/actions";
import styles from "./ProjectsList.module.scss";

type DeleteProjectButtonProps = {
  id: string;
  title: string;
};

export default function DeleteProjectButton({ id, title }: DeleteProjectButtonProps) {
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
    <form action={deleteProjectAction} className={styles.actions}>
      <input type="hidden" name="id" value={id} />
      <span className={styles.meta}>
        למחוק את &quot;{title}&quot;?
      </span>
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
