import Link from "next/link";
import type { AdminIntentListItemDto } from "@/types/intent";
import { formatIntentProviderLabel } from "@/lib/business/intents/rules";
import IntentClassificationBadge from "./IntentClassificationBadge";
import IntentStatusBadge from "./IntentStatusBadge";
import styles from "./IntentItem.module.scss";

type IntentItemProps = {
  intent: AdminIntentListItemDto;
};

function formatDiscoveredAt(iso: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function displayTitle(intent: AdminIntentListItemDto): string {
  if (intent.title?.trim()) {
    return intent.title.trim();
  }
  return intent.contentPreview.trim() || "ללא כותרת";
}

export default function IntentItem({ intent }: IntentItemProps) {
  return (
    <li className={styles.item}>
      <Link href={`/admin/business/intent/${intent.id}`} className={styles.link}>
        <div className={styles.topRow}>
          <h2 className={styles.title}>{displayTitle(intent)}</h2>
          <IntentStatusBadge status={intent.status} />
        </div>

        <p className={styles.snippet}>{intent.contentPreview}</p>

        <div className={styles.meta}>
          <IntentClassificationBadge classification={intent.classification} />
          <span className={styles.metaText}>{formatIntentProviderLabel(intent.provider)}</span>
          {intent.sourcePlatform && (
            <span className={styles.metaText}>{intent.sourcePlatform}</span>
          )}
          <span className={styles.metaText}>{formatDiscoveredAt(intent.discoveredAt)}</span>
          {intent.discoveryCount > 1 && (
            <span className={styles.metaText}>נצפה {intent.discoveryCount} פעמים</span>
          )}
        </div>
      </Link>
    </li>
  );
}
