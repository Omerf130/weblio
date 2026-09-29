"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateIntentClassificationAction } from "@/lib/business/intents/actions";
import type { IntentActionState } from "@/lib/business/intents/action-states";
import type { IntentClassification } from "@/types/intent";
import styles from "./IntentClassificationForm.module.scss";

type IntentClassificationFormProps = {
  intentId: string;
  currentClassification: IntentClassification;
  currentReason?: string;
  disabled?: boolean;
};

const OPTIONS: { value: IntentClassification; label: string }[] = [
  { value: "explicitNeed", label: "צורך מפורש" },
  { value: "possibleNeed", label: "צורך אפשרי" },
  { value: "irrelevant", label: "לא רלוונטי" },
  { value: "unclassified", label: "החזר לטרם סווג" },
];

export default function IntentClassificationForm({
  intentId,
  currentClassification,
  currentReason,
  disabled,
}: IntentClassificationFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    IntentActionState,
    FormData
  >(updateIntentClassificationAction, {});

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="intentId" value={intentId} />

      <fieldset className={styles.fieldset} disabled={disabled || pending}>
        <legend className={styles.legend}>סיווג ידני</legend>

        <div className={styles.options}>
          {OPTIONS.map((opt) => (
            <label key={opt.value} className={styles.option}>
              <input
                type="radio"
                name="classification"
                value={opt.value}
                defaultChecked={currentClassification === opt.value}
                required
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>

        <label htmlFor="intent-classification-reason" className={styles.label}>
          סיבת סיווג (אופציונלי)
        </label>
        <textarea
          id="intent-classification-reason"
          name="classificationReason"
          className={styles.textarea}
          rows={2}
          maxLength={500}
          defaultValue={currentReason ?? ""}
          placeholder="משפט קצר בעברית"
        />

        <button
          type="submit"
          className={styles.submit}
          disabled={pending}
          suppressHydrationWarning
        >
          {pending ? "שומר…" : "שמור סיווג"}
        </button>
      </fieldset>

      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className={styles.success} role="status">
          הסיווג עודכן.
        </p>
      )}
    </form>
  );
}
