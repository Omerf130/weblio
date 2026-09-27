import type { FollowUpStatus } from "@/types/follow-up";
import { FOLLOW_UP_STATUS_LABELS } from "@/lib/business/follow-ups/rules";
import styles from "./FollowUpStatusBadge.module.scss";

type FollowUpStatusBadgeProps = {
  status: FollowUpStatus;
};

export default function FollowUpStatusBadge({ status }: FollowUpStatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[`badge_${status}`]}`}>
      {FOLLOW_UP_STATUS_LABELS[status]}
    </span>
  );
}
