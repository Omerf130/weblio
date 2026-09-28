import type { OpportunityStatus } from "@/types/opportunity";
import { OPPORTUNITY_STATUS_LABELS } from "@/lib/business/opportunities/rules";
import styles from "./OpportunityStatusBadge.module.scss";

type OpportunityStatusBadgeProps = {
  status: OpportunityStatus;
};

export default function OpportunityStatusBadge({ status }: OpportunityStatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[`badge_${status}`]}`}>
      {OPPORTUNITY_STATUS_LABELS[status]}
    </span>
  );
}
