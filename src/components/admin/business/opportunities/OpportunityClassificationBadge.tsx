import type { OpportunityClassification } from "@/types/opportunity";
import { OPPORTUNITY_CLASSIFICATION_LABELS } from "@/lib/business/opportunities/rules";
import styles from "./OpportunityClassificationBadge.module.scss";

type OpportunityClassificationBadgeProps = {
  classification: OpportunityClassification;
};

export default function OpportunityClassificationBadge({
  classification,
}: OpportunityClassificationBadgeProps) {
  return (
    <span className={styles.badge}>{OPPORTUNITY_CLASSIFICATION_LABELS[classification]}</span>
  );
}
