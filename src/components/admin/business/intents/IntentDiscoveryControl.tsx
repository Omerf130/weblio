"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { runTavilyDiscoveryAction } from "@/lib/business/discovery/actions";
import {
  formatDiscoveryActionResult,
  formatLastDiscoveryRunHintHebrew,
  type DiscoveryActionMessage,
  type LastDiscoveryRunHint,
} from "@/lib/business/discovery/discovery-run-messages";
import styles from "./IntentDiscoveryControl.module.scss";

type IntentDiscoveryControlProps = {
  lastRun?: LastDiscoveryRunHint | null;
};

export default function IntentDiscoveryControl({
  lastRun,
}: IntentDiscoveryControlProps) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<DiscoveryActionMessage | null>(null);

  const handleRunDiscovery = useCallback(async () => {
    if (running) {
      return;
    }

    setRunning(true);
    setMessage(null);

    try {
      const result = await runTavilyDiscoveryAction();
      setMessage(formatDiscoveryActionResult(result));

      if (result.success) {
        router.refresh();
      }
    } catch {
      setMessage({
        variant: "error",
        title: "החיפוש נכשל",
        lines: ["לא ניתן להשלים את החיפוש כרגע. נסה שוב מאוחר יותר."],
      });
    } finally {
      setRunning(false);
    }
  }, [running, router]);

  const messageRole = message?.variant === "error" ? "alert" : "status";

  return (
    <section className={styles.section} aria-labelledby="intent-discovery-heading">
      <div className={styles.textBlock}>
        <h2 id="intent-discovery-heading" className={styles.title}>
          חיפוש הזדמנויות
        </h2>
        <p className={styles.helper}>
          מחפש תוצאות עדכניות ברשת ומעביר מועמדים רלוונטיים לניטור הכוונות לבדיקה
          וסיווג.
        </p>
        {lastRun ? (
          <p className={styles.lastRun}>{formatLastDiscoveryRunHintHebrew(lastRun)}</p>
        ) : null}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => void handleRunDiscovery()}
          disabled={running}
          aria-busy={running}
        >
          {running ? "מחפש הזדמנויות..." : "חפש הזדמנויות חדשות"}
        </button>
      </div>

      {message ? (
        <div
          className={`${styles.result} ${styles[`result_${message.variant}`]}`}
          role={messageRole}
          aria-live="polite"
        >
          <p className={styles.resultTitle}>{message.title}</p>
          <ul className={styles.resultList}>
            {message.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
