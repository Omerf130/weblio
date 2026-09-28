import Link from "next/link";
import type { AdminOpportunityDto } from "@/types/opportunity";
import { OPPORTUNITY_SOURCE_LABELS } from "@/lib/business/opportunities/rules";
import OpportunityStatusBadge from "./OpportunityStatusBadge";
import OpportunityClassificationBadge from "./OpportunityClassificationBadge";
import styles from "./OpportunityItem.module.scss";

type OpportunityItemProps = {
  opportunity: AdminOpportunityDto;
};

function formatCreatedAt(iso: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export default function OpportunityItem({ opportunity }: OpportunityItemProps) {
  const subtitleParts = [
    opportunity.businessName,
    opportunity.contactName,
  ].filter(Boolean);

  return (
    <li className={styles.item}>
      <Link
        href={`/admin/business/opportunities/${opportunity.id}`}
        className={styles.link}
      >
        <div className={styles.topRow}>
          <h2 className={styles.title}>{opportunity.title}</h2>
          <OpportunityStatusBadge status={opportunity.status} />
        </div>

        {subtitleParts.length > 0 && (
          <p className={styles.subtitle}>{subtitleParts.join(" · ")}</p>
        )}

        <div className={styles.meta}>
          <OpportunityClassificationBadge classification={opportunity.classification} />
          <span className={styles.metaText}>
            {OPPORTUNITY_SOURCE_LABELS[opportunity.source]}
          </span>
          {opportunity.sourcePlatform && (
            <span className={styles.metaText}>{opportunity.sourcePlatform}</span>
          )}
          <span className={styles.metaText}>{formatCreatedAt(opportunity.createdAt)}</span>
          {opportunity.status === "converted" && opportunity.leadId && (
            <span className={styles.leadLinkHint}>· ליד קיים</span>
          )}
        </div>
      </Link>
    </li>
  );
}
