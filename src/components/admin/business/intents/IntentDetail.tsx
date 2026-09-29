"use client";

import Link from "next/link";
import type { AdminIntentDetailDto } from "@/types/intent";
import {
  formatIntentProviderLabel,
  INTENT_SOURCE_TYPE_LABELS,
} from "@/lib/business/intents/rules";
import { canIntentClassificationConvertToOpportunity } from "@/lib/business/intents/classification-rules";
import {
  convertIntentToOpportunityFormAction,
  setIntentStatusFormAction,
} from "@/lib/business/intents/actions";
import IntentClassificationBadge from "./IntentClassificationBadge";
import IntentStatusBadge from "./IntentStatusBadge";
import IntentClassificationForm from "./IntentClassificationForm";
import styles from "./IntentDetail.module.scss";

type IntentDetailProps = {
  intent: AdminIntentDetailDto;
  errorMessage?: string;
  listReturnHref: string;
};

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function displayTitle(intent: AdminIntentDetailDto): string {
  if (intent.title?.trim()) {
    return intent.title.trim();
  }
  const line = intent.content.trim().split("\n")[0];
  return line || "ללא כותרת";
}

export default function IntentDetail({
  intent,
  errorMessage,
  listReturnHref,
}: IntentDetailProps) {
  const isSaved = intent.status === "saved";
  const isDismissed = intent.status === "dismissed";
  const canChangeWorkflow = intent.status === "new" || intent.status === "dismissed";
  const canSaveAsOpportunity =
    intent.status === "new" &&
    !intent.opportunityId &&
    canIntentClassificationConvertToOpportunity(intent.classification);

  const rawMetadataJson =
    intent.rawMetadata && Object.keys(intent.rawMetadata).length > 0
      ? JSON.stringify(intent.rawMetadata, null, 2)
      : null;

  return (
    <div className={styles.page} dir="rtl">
      <Link href={listReturnHref} className={styles.backLink}>
        ← חזרה לרשימה
      </Link>

      {errorMessage && (
        <p className={styles.errorBanner} role="alert">
          {errorMessage}
        </p>
      )}

      {isSaved && (
        <div className={styles.savedBanner} role="status">
          <p className={styles.savedBannerText}>
            רשומה זו נשמרה כהזדמנות
            {intent.convertedAt
              ? ` · ${formatDateTime(intent.convertedAt)}`
              : ""}
            . הצגה לצפייה בלבד.
          </p>
          {intent.opportunityId && (
            <Link
              href={`/admin/business/opportunities/${intent.opportunityId}`}
              className={styles.savedOpportunityLink}
            >
              צפייה בהזדמנות
            </Link>
          )}
        </div>
      )}

      <header className={styles.header}>
        <h1 className={styles.title}>{displayTitle(intent)}</h1>
        <div className={styles.badges}>
          <IntentStatusBadge status={intent.status} />
          <IntentClassificationBadge classification={intent.classification} />
          <span className={styles.providerMeta}>
            {formatIntentProviderLabel(intent.provider)}
          </span>
        </div>
      </header>

      <section className={styles.section} aria-labelledby="intent-content-heading">
        <h2 id="intent-content-heading" className={styles.sectionTitle}>
          תוכן
        </h2>
        <pre className={styles.content}>{intent.content}</pre>
        {intent.classificationReason && (
          <p className={styles.reason}>
            <strong>סיבת סיווג: </strong>
            {intent.classificationReason}
          </p>
        )}
      </section>

      {!isSaved && (
        <section className={styles.section} aria-labelledby="intent-review-heading">
          <h2 id="intent-review-heading" className={styles.sectionTitle}>
            סקירה
          </h2>
          <IntentClassificationForm
            intentId={intent.id}
            currentClassification={intent.classification}
            currentReason={intent.classificationReason}
          />

          {canSaveAsOpportunity && (
            <form
              action={convertIntentToOpportunityFormAction}
              className={styles.saveAsOpportunityForm}
            >
              <input type="hidden" name="intentId" value={intent.id} />
              <input type="hidden" name="returnTo" value={listReturnHref} />
              <button
                type="submit"
                className={styles.saveAsOpportunityButton}
                suppressHydrationWarning
              >
                שמור כהזדמנות
              </button>
            </form>
          )}

          {canChangeWorkflow && (
            <div className={styles.workflowActions}>
              {intent.status === "new" && (
                <form action={setIntentStatusFormAction}>
                  <input type="hidden" name="intentId" value={intent.id} />
                  <input type="hidden" name="status" value="dismissed" />
                  <input type="hidden" name="returnTo" value={listReturnHref} />
                  <button
                    type="submit"
                    className={styles.dismissButton}
                    suppressHydrationWarning
                  >
                    דחה
                  </button>
                </form>
              )}
              {isDismissed && (
                <form action={setIntentStatusFormAction}>
                  <input type="hidden" name="intentId" value={intent.id} />
                  <input type="hidden" name="status" value="new" />
                  <input type="hidden" name="returnTo" value={listReturnHref} />
                  <button
                    type="submit"
                    className={styles.reopenButton}
                    suppressHydrationWarning
                  >
                    החזר לרשימה
                  </button>
                </form>
              )}
            </div>
          )}
        </section>
      )}

      <section className={styles.section} aria-labelledby="intent-source-heading">
        <h2 id="intent-source-heading" className={styles.sectionTitle}>
          מקור
        </h2>
        <dl className={styles.dl}>
          {intent.sourcePlatform && (
            <>
              <dt>פלטפורמה</dt>
              <dd>{intent.sourcePlatform}</dd>
            </>
          )}
          <dt>ספק</dt>
          <dd>{formatIntentProviderLabel(intent.provider)}</dd>
          {intent.sourceUrl && (
            <>
              <dt>קישור</dt>
              <dd>
                <a
                  href={intent.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.externalLink}
                >
                  {intent.sourceUrl}
                </a>
              </dd>
            </>
          )}
          {intent.authorDisplayName && (
            <>
              <dt>מחבר/ת</dt>
              <dd>{intent.authorDisplayName}</dd>
            </>
          )}
          {intent.publishedAt && (
            <>
              <dt>תאריך פרסום</dt>
              <dd>{formatDateTime(intent.publishedAt)}</dd>
            </>
          )}
          <dt>גילוי ראשון</dt>
          <dd>{formatDateTime(intent.discoveredAt)}</dd>
          <dt>נראה לאחרונה</dt>
          <dd>{formatDateTime(intent.lastSeenAt)}</dd>
          <dt>מספר גילויים</dt>
          <dd>{intent.discoveryCount}</dd>
        </dl>
      </section>

      <section className={styles.sectionMuted} aria-labelledby="intent-provenance-heading">
        <h2 id="intent-provenance-heading" className={styles.sectionTitleMuted}>
          מידע טכני
        </h2>
        <dl className={styles.dlMuted}>
          {intent.externalId && (
            <>
              <dt>מזהה חיצוני</dt>
              <dd>{intent.externalId}</dd>
            </>
          )}
          {intent.sourceType && (
            <>
              <dt>סוג מקור</dt>
              <dd>{INTENT_SOURCE_TYPE_LABELS[intent.sourceType] ?? intent.sourceType}</dd>
            </>
          )}
        </dl>
        {rawMetadataJson && (
          <details className={styles.metadataDetails}>
            <summary>מטא-דאטה (debug)</summary>
            <pre className={styles.metadataPre}>{rawMetadataJson}</pre>
          </details>
        )}
      </section>
    </div>
  );
}
