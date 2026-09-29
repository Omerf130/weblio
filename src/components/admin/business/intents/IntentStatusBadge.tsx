import type { IntentStatus } from "@/types/intent";
import { INTENT_STATUS_LABELS } from "@/lib/business/intents/rules";
import styles from "./IntentStatusBadge.module.scss";

type IntentStatusBadgeProps = {
  status: IntentStatus;
};

export default function IntentStatusBadge({ status }: IntentStatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[`badge_${status}`] ?? ""}`}>
      {INTENT_STATUS_LABELS[status]}
    </span>
  );
}
