import Link from "next/link";
import IntentClassificationBadge from "@/components/admin/business/intents/IntentClassificationBadge";
import type { AdminIntentListItemDto } from "@/types/intent";
import styles from "./BusinessOverview.module.scss";

type Props = {
  intents: AdminIntentListItemDto[];
};

function formatDiscovered(iso: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function intentTitle(intent: AdminIntentListItemDto): string {
  const trimmed = intent.title?.trim();
  if (trimmed) {
    return trimmed;
  }
  return intent.contentPreview;
}

function intentSource(intent: AdminIntentListItemDto): string {
  if (intent.sourcePlatform?.trim()) {
    return intent.sourcePlatform.trim();
  }
  return intent.provider;
}

export default function BusinessOverviewRecentIntents({ intents }: Props) {
  return (
    <section className={styles.panel} aria-labelledby="overview-intents-title">
      <div className={styles.panelHeader}>
        <h2 id="overview-intents-title" className={styles.panelTitle}>
          כוונות Discovery אחרונות
        </h2>
        <Link href="/admin/business/intent?status=new" className={styles.panelLink}>
          צפייה בכל הכוונות
        </Link>
      </div>

      {intents.length === 0 ? (
        <p className={styles.emptyState}>אין כוונות מסווגות חדשות</p>
      ) : (
        <ul className={styles.intentList}>
          {intents.map((intent) => (
            <li key={intent.id}>
              <Link
                href={`/admin/business/intent/${intent.id}`}
                className={styles.intentRow}
              >
                <span className={styles.intentTitle}>{intentTitle(intent)}</span>
                <div className={styles.intentMeta}>
                  <IntentClassificationBadge classification={intent.classification} />
                  <span className={styles.intentSource}>{intentSource(intent)}</span>
                  <time dateTime={intent.discoveredAt} className={styles.intentDate}>
                    {formatDiscovered(intent.discoveredAt)}
                  </time>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
