"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { AdminFollowUpDto } from "@/types/follow-up";
import type { LeadSummary } from "@/lib/data/leads";
import type { OpportunitySummary } from "@/types/opportunity";
import FollowUpFilterTabs, { type FollowUpFilter } from "./FollowUpFilterTabs";
import FollowUpItem from "./FollowUpItem";
import FollowUpForm from "./FollowUpForm";
import styles from "./FollowUpsManager.module.scss";

type FollowUpsManagerProps = {
  followUps: AdminFollowUpDto[];
  leadSummaries: Record<string, LeadSummary>;
  opportunitySummaries: Record<string, OpportunitySummary>;
  leadOptions: LeadSummary[];
  opportunityOptions: OpportunitySummary[];
  activeFilter: FollowUpFilter;
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
  };
  autoOpenNew?: boolean;
  preselectedLeadId?: string;
  preselectedOpportunityId?: string;
  preselectedOpportunity?: OpportunitySummary;
};

export default function FollowUpsManager({
  followUps,
  leadSummaries,
  opportunitySummaries,
  leadOptions,
  opportunityOptions,
  activeFilter,
  pagination,
  autoOpenNew,
  preselectedLeadId,
  preselectedOpportunityId,
  preselectedOpportunity,
}: FollowUpsManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<AdminFollowUpDto | undefined>();

  useEffect(() => {
    if (autoOpenNew) {
      setShowForm(true);
    }
  }, [autoOpenNew]);

  function handleNewClick() {
    setEditingFollowUp(undefined);
    setShowForm(true);
  }

  function handleEdit(followUp: AdminFollowUpDto) {
    setEditingFollowUp(followUp);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingFollowUp(undefined);
  }

  const totalCount = pagination?.total ?? followUps.length;

  return (
    <div className={styles.page} dir="rtl">
      <header className={styles.header}>
        <div>
          <h1 className={styles.heading}>מעקבים</h1>
          <p className={styles.subtitle}>
            {totalCount === 0
              ? "אין מעקבים"
              : `${totalCount} מעקבים`}
          </p>
        </div>
        <button
          type="button"
          className={styles.newButton}
          onClick={handleNewClick}
        >
          מעקב חדש
        </button>
      </header>

      {showForm && (
        <FollowUpForm
          editingFollowUp={editingFollowUp}
          leadOptions={leadOptions}
          opportunityOptions={opportunityOptions}
          preselectedLeadId={preselectedLeadId}
          preselectedOpportunityId={preselectedOpportunityId}
          preselectedOpportunity={preselectedOpportunity}
          onClose={handleCloseForm}
        />
      )}

      <FollowUpFilterTabs activeFilter={activeFilter} />

      {followUps.length === 0 ? (
        <p className={styles.empty}>
          {activeFilter === "all" && "אין מעקבים פתוחים כרגע."}
          {activeFilter === "today" && "אין מעקבים מתוכננים להיום."}
          {activeFilter === "overdue" && "אין מעקבים באיחור. מצוין!"}
          {activeFilter === "upcoming" && "אין מעקבים קרובים."}
          {activeFilter === "completed" && "אין מעקבים שהושלמו."}
          {activeFilter === "cancelled" && "אין מעקבים שבוטלו."}
        </p>
      ) : (
        <ul className={styles.list}>
          {followUps.map((fu) => (
            <FollowUpItem
              key={fu.id}
              followUp={fu}
              leadSummary={fu.leadId ? leadSummaries[fu.leadId] : undefined}
              opportunitySummary={
                fu.opportunityId ? opportunitySummaries[fu.opportunityId] : undefined
              }
              onEdit={handleEdit}
            />
          ))}
        </ul>
      )}

      {pagination && pagination.totalPages > 1 && (
        <nav className={styles.pagination} aria-label="ניווט דפים">
          {pagination.page > 1 ? (
            <Link
              href={`/admin/business/follow-ups?filter=${activeFilter}&page=${pagination.page - 1}`}
              className={styles.pageLink}
            >
              הקודם
            </Link>
          ) : (
            <span className={styles.pageLinkDisabled}>הקודם</span>
          )}

          <span className={styles.pageInfo}>
            עמוד {pagination.page} מתוך {pagination.totalPages}
          </span>

          {pagination.page < pagination.totalPages ? (
            <Link
              href={`/admin/business/follow-ups?filter=${activeFilter}&page=${pagination.page + 1}`}
              className={styles.pageLink}
            >
              הבא
            </Link>
          ) : (
            <span className={styles.pageLinkDisabled}>הבא</span>
          )}
        </nav>
      )}
    </div>
  );
}
