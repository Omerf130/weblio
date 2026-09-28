"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AdminOpportunityDto } from "@/types/opportunity";
import { buildOpportunityListHref } from "@/lib/business/opportunities/list-url";
import type {
  OpportunityClassificationFilter,
  OpportunitySourceFilter,
  OpportunityStatusFilter,
} from "@/lib/business/opportunities/list-url";
import OpportunityFilters from "./OpportunityFilters";
import OpportunityItem from "./OpportunityItem";
import OpportunityForm from "./OpportunityForm";
import styles from "./OpportunitiesManager.module.scss";

type OpportunitiesManagerProps = {
  opportunities: AdminOpportunityDto[];
  status: OpportunityStatusFilter;
  classification: OpportunityClassificationFilter;
  source: OpportunitySourceFilter;
  q: string;
  pagination: {
    page: number;
    totalPages: number;
    totalItems: number;
  };
  autoOpenNew?: boolean;
  hasActiveFilters: boolean;
};

export default function OpportunitiesManager({
  opportunities,
  status,
  classification,
  source,
  q,
  pagination,
  autoOpenNew,
  hasActiveFilters,
}: OpportunitiesManagerProps) {
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (autoOpenNew) {
      setShowCreate(true);
    }
  }, [autoOpenNew]);

  const listHrefBase = { status, classification, source, q };

  return (
    <div className={styles.page} dir="rtl">
      <header className={styles.header}>
        <div>
          <h1 className={styles.heading}>הזדמנויות</h1>
          <p className={styles.subtitle}>
            {pagination.totalItems === 0
              ? "אין הזדמנויות"
              : `${pagination.totalItems} הזדמנויות`}
          </p>
        </div>
        <button
          type="button"
          className={styles.newButton}
          onClick={() => setShowCreate(true)}
        >
          הזדמנות חדשה
        </button>
      </header>

      {showCreate && (
        <OpportunityForm
          redirectOnCreate
          onClose={() => setShowCreate(false)}
        />
      )}

      <OpportunityFilters
        status={status}
        classification={classification}
        source={source}
        q={q}
      />

      {opportunities.length === 0 ? (
        <p className={styles.empty}>
          {hasActiveFilters
            ? "לא נמצאו הזדמנויות לפי הסינון הנוכחי."
            : "עדיין אין הזדמנויות. צרו הזדמנות ראשונה כדי להתחיל מעקב."}
        </p>
      ) : (
        <ul className={styles.list}>
          {opportunities.map((opp) => (
            <OpportunityItem key={opp.id} opportunity={opp} />
          ))}
        </ul>
      )}

      {pagination.totalPages > 1 && (
        <nav className={styles.pagination} aria-label="ניווט דפים">
          {pagination.page > 1 ? (
            <Link
              href={buildOpportunityListHref({
                ...listHrefBase,
                page: pagination.page - 1,
              })}
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
              href={buildOpportunityListHref({
                ...listHrefBase,
                page: pagination.page + 1,
              })}
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
