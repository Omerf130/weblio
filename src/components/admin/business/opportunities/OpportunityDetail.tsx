"use client";

import { useState } from "react";
import Link from "next/link";
import type { AdminFollowUpDto } from "@/types/follow-up";
import type { AdminOpportunityDetailDto } from "@/types/opportunity";
import {
  OPPORTUNITY_SOURCE_LABELS,
  OPPORTUNITY_STATUS_LABELS,
  getManualStatusTransitionTargets,
} from "@/lib/business/opportunities/rules";
import {
  deleteOpportunityAction,
  setOpportunityStatusFormAction,
} from "@/lib/business/opportunities/actions";
import FollowUpItem from "@/components/admin/business/follow-ups/FollowUpItem";
import FollowUpForm from "@/components/admin/business/follow-ups/FollowUpForm";
import type { LeadSummary } from "@/lib/data/leads";
import OpportunityStatusBadge from "./OpportunityStatusBadge";
import OpportunityClassificationBadge from "./OpportunityClassificationBadge";
import OpportunityForm from "./OpportunityForm";
import OpportunityConvertForm from "./OpportunityConvertForm";
import styles from "./OpportunityDetail.module.scss";

type OpportunityDetailProps = {
  opportunity: AdminOpportunityDetailDto;
  followUps: AdminFollowUpDto[];
  leadOptions: LeadSummary[];
  errorMessage?: string;
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

export default function OpportunityDetail({
  opportunity,
  followUps,
  leadOptions,
  errorMessage,
}: OpportunityDetailProps) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<AdminFollowUpDto | undefined>();
  const [showConvert, setShowConvert] = useState(false);

  const isConverted = opportunity.status === "converted";
  const statusTargets = getManualStatusTransitionTargets(opportunity.status);

  return (
    <div className={styles.page} dir="rtl">
      <Link href="/admin/business/opportunities" className={styles.backLink}>
        ← חזרה לרשימה
      </Link>

      {errorMessage && (
        <p className={styles.errorBanner} role="alert">
          {errorMessage}
        </p>
      )}

      {isConverted && (
        <div className={styles.convertedBanner} role="status">
          <p className={styles.convertedBannerText}>
            הזדמנות זו הומרה לליד
            {opportunity.convertedAt
              ? ` · ${formatDateTime(opportunity.convertedAt)}`
              : ""}
            . הצגה לצפייה בלבד.
          </p>
          {opportunity.leadId && (
            <Link
              href={`/admin/leads/${opportunity.leadId}`}
              className={styles.convertedLeadLink}
            >
              צפייה בליד
            </Link>
          )}
        </div>
      )}

      {opportunity.source === "intent" && opportunity.intentId && (
        <div className={styles.intentProvenanceBanner} role="status">
          <span className={styles.intentProvenanceText}>נוצר מכוונה</span>
          <Link
            href={`/admin/business/intent/${opportunity.intentId}`}
            className={styles.intentProvenanceLink}
          >
            צפייה בכוונה המקורית
          </Link>
        </div>
      )}

      <header className={styles.header}>
        <h1 className={styles.title}>{opportunity.title}</h1>
        <div className={styles.badges}>
          <OpportunityStatusBadge status={opportunity.status} />
          <OpportunityClassificationBadge classification={opportunity.classification} />
          <span className={styles.sourceMeta}>
            {OPPORTUNITY_SOURCE_LABELS[opportunity.source]}
          </span>
        </div>
      </header>

      {(opportunity.businessName ||
        opportunity.contactName ||
        opportunity.phone ||
        opportunity.email) && (
        <section className={styles.section} aria-labelledby="opp-contact-heading">
          <h2 id="opp-contact-heading" className={styles.sectionTitle}>
            פרטי קשר
          </h2>
          <dl className={styles.dl}>
            {opportunity.businessName && (
              <>
                <dt>עסק</dt>
                <dd>{opportunity.businessName}</dd>
              </>
            )}
            {opportunity.contactName && (
              <>
                <dt>איש קשר</dt>
                <dd>{opportunity.contactName}</dd>
              </>
            )}
            {opportunity.phone && (
              <>
                <dt>טלפון</dt>
                <dd>
                  <a href={`tel:${opportunity.phone}`}>{opportunity.phone}</a>
                </dd>
              </>
            )}
            {opportunity.email && (
              <>
                <dt>אימייל</dt>
                <dd>
                  <a href={`mailto:${opportunity.email}`}>{opportunity.email}</a>
                </dd>
              </>
            )}
          </dl>
        </section>
      )}

      {(opportunity.sourceUrl || opportunity.sourcePlatform) && (
        <section className={styles.section} aria-labelledby="opp-source-heading">
          <h2 id="opp-source-heading" className={styles.sectionTitle}>
            מקור
          </h2>
          {opportunity.sourcePlatform && (
            <p className={styles.bodyText}>{opportunity.sourcePlatform}</p>
          )}
          {opportunity.sourceUrl && (
            <a
              href={opportunity.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.externalLink}
            >
              פתח מקור
            </a>
          )}
        </section>
      )}

      {opportunity.description && (
        <section className={styles.section} aria-labelledby="opp-desc-heading">
          <h2 id="opp-desc-heading" className={styles.sectionTitle}>
            תיאור
          </h2>
          <p className={styles.bodyText}>{opportunity.description}</p>
        </section>
      )}

      {opportunity.relevanceNote && (
        <section className={styles.section} aria-labelledby="opp-rel-heading">
          <h2 id="opp-rel-heading" className={styles.sectionTitle}>
            למה זה רלוונטי
          </h2>
          <p className={styles.bodyText}>{opportunity.relevanceNote}</p>
        </section>
      )}

      {opportunity.internalNotes && (
        <section className={styles.section} aria-labelledby="opp-notes-heading">
          <h2 id="opp-notes-heading" className={styles.sectionTitle}>
            הערות פנימיות
          </h2>
          <p className={styles.bodyText}>{opportunity.internalNotes}</p>
        </section>
      )}

      <p className={styles.timestamps}>
        נוצר: {formatDateTime(opportunity.createdAt)} · עודכן:{" "}
        {formatDateTime(opportunity.updatedAt)}
      </p>

      <section className={styles.section} aria-labelledby="opp-followups-heading">
        <div className={styles.sectionHeader}>
          <h2 id="opp-followups-heading" className={styles.sectionTitle}>
            מעקבים
          </h2>
          {!isConverted && (
            <Link
              href={`/admin/business/follow-ups?new=1&opportunityId=${opportunity.id}`}
              className={styles.addLink}
            >
              הוסף מעקב
            </Link>
          )}
        </div>

        {editingFollowUp && (
          <FollowUpForm
            editingFollowUp={editingFollowUp}
            leadOptions={leadOptions}
            onClose={() => setEditingFollowUp(undefined)}
          />
        )}

        {followUps.length === 0 ? (
          <p className={styles.emptyNote}>אין מעקבים להזדמנות זו</p>
        ) : (
          <ul className={styles.followUpList}>
            {followUps.map((fu) => (
              <FollowUpItem
                key={fu.id}
                followUp={fu}
                showRelations={false}
                onEdit={(item) => setEditingFollowUp(item)}
              />
            ))}
          </ul>
        )}
      </section>

      {!isConverted && (
        <section className={styles.actionsSection} aria-label="פעולות">
          {showConvert ? (
            <OpportunityConvertForm
              opportunity={opportunity}
              onCancel={() => setShowConvert(false)}
            />
          ) : (
            <button
              type="button"
              className={styles.primaryConvertButton}
              onClick={() => {
                setShowConvert(true);
                setEditing(false);
              }}
            >
              המר לליד
            </button>
          )}

          {!editing ? (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setEditing(true)}
            >
              עריכה
            </button>
          ) : (
            <OpportunityForm
              editingOpportunity={opportunity}
              onClose={() => setEditing(false)}
            />
          )}

          {statusTargets.length > 0 && (
            <div className={styles.statusActions}>
              <span className={styles.statusActionsLabel}>עדכון סטטוס</span>
              {statusTargets.map((nextStatus) => (
                <form key={nextStatus} action={setOpportunityStatusFormAction}>
                  <input type="hidden" name="id" value={opportunity.id} />
                  <input type="hidden" name="status" value={nextStatus} />
                  <button type="submit" className={styles.statusButton}>
                    {OPPORTUNITY_STATUS_LABELS[nextStatus]}
                  </button>
                </form>
              ))}
            </div>
          )}

          {!confirmDelete ? (
            <button
              type="button"
              className={styles.dangerButton}
              onClick={() => setConfirmDelete(true)}
              aria-label="מחק הזדמנות"
            >
              מחיקה
            </button>
          ) : (
            <form action={deleteOpportunityAction} className={styles.confirmDelete}>
              <input type="hidden" name="id" value={opportunity.id} />
              <span>למחוק את ההזדמנות?</span>
              <button type="submit" className={styles.dangerButton}>
                כן, מחק
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setConfirmDelete(false)}
              >
                ביטול
              </button>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
