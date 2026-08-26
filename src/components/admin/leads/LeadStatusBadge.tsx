import type { LeadStatus } from "@/types/lead";
import { LEAD_STATUS_LABELS } from "@/lib/leads/rules";
import styles from "./LeadsList.module.scss";

type LeadStatusBadgeProps = {
  status: LeadStatus;
};

export default function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[`badge_${status}`]}`}>
      {LEAD_STATUS_LABELS[status]}
    </span>
  );
}
