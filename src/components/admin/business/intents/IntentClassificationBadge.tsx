import type { IntentClassification } from "@/types/intent";
import { INTENT_CLASSIFICATION_LABELS } from "@/lib/business/intents/classification-rules";
import styles from "./IntentClassificationBadge.module.scss";

type IntentClassificationBadgeProps = {
  classification: IntentClassification;
};

export default function IntentClassificationBadge({
  classification,
}: IntentClassificationBadgeProps) {
  return (
    <span
      className={`${styles.badge} ${styles[`badge_${classification}`] ?? ""}`}
    >
      {INTENT_CLASSIFICATION_LABELS[classification]}
    </span>
  );
}
