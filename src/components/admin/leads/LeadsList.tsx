"use client";

import Link from "next/link";
import type { AdminLeadDto } from "@/types/lead";
import {
  formatLeadNumber,
  getLeadEmptyStateMessage,
  LEAD_SOURCE_LABELS,
  parseLeadSourceFilter,
} from "@/lib/leads/rules";
import DeleteLeadButton from "./DeleteLeadButton";
import LeadSourceTabs from "./LeadSourceTabs";
import LeadStatusBadge from "./LeadStatusBadge";
import styles from "./LeadsList.module.scss";

type LeadsListProps = {
  leads: AdminLeadDto[];
  source?: string;
  query?: string;
  errorMessage?: string;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function LeadsList({
  leads,
  source,
  query,
  errorMessage,
}: LeadsListProps) {
  const sourceFilter = parseLeadSourceFilter(source);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h1 className={styles.title}>פניות</h1>
      </div>

      {errorMessage ? (
        <p className={styles.alert} role="alert">
          {errorMessage}
        </p>
      ) : null}

      <LeadSourceTabs activeSource={sourceFilter} query={query} />

      <form className={styles.searchForm} method="get">
        {sourceFilter !== "all" ? (
          <input type="hidden" name="source" value={sourceFilter} />
        ) : null}
        <label className={styles.searchLabel} htmlFor="lead-search">
          חיפוש
        </label>
        <div className={styles.searchRow}>
          <input
            id="lead-search"
            name="q"
            type="search"
            defaultValue={query ?? ""}
            placeholder="שם, טלפון, מייל או מספר ליד"
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>
            חיפוש
          </button>
        </div>
      </form>

      {leads.length === 0 ? (
        <div className={styles.empty}>{getLeadEmptyStateMessage(sourceFilter)}</div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>מספר</th>
                  <th>שם</th>
                  <th>טלפון</th>
                  <th>מייל</th>
                  <th>מקור</th>
                  <th>סטטוס</th>
                  <th>תאריך</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className={lead.isRead ? undefined : styles.unreadRow}
                  >
                    <td>
                      <span className={styles.leadNumber}>
                        {!lead.isRead ? (
                          <span className={styles.unreadDot} aria-hidden />
                        ) : null}
                        {formatLeadNumber(lead.leadNumber)}
                      </span>
                    </td>
                    <td>{lead.name}</td>
                    <td>{lead.phone}</td>
                    <td>{lead.email}</td>
                    <td>{LEAD_SOURCE_LABELS[lead.source]}</td>
                    <td>
                      <LeadStatusBadge status={lead.status} />
                    </td>
                    <td>{formatDate(lead.createdAt)}</td>
                    <td>
                      <div className={styles.actions}>
                        <Link href={`/admin/leads/${lead.id}`} className={styles.linkButton}>
                          פתיחה
                        </Link>
                        <DeleteLeadButton
                          id={lead.id}
                          label={formatLeadNumber(lead.leadNumber)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.cards}>
            {leads.map((lead) => (
              <article
                key={lead.id}
                className={`${styles.card} ${lead.isRead ? "" : styles.unreadCard}`.trim()}
              >
                <div className={styles.cardHeader}>
                  <div>
                    <p className={styles.cardLeadNumber}>{formatLeadNumber(lead.leadNumber)}</p>
                    <h2 className={styles.cardTitle}>{lead.name}</h2>
                  </div>
                  <LeadStatusBadge status={lead.status} />
                </div>
                <dl className={styles.cardMeta}>
                  <div>
                    <dt>טלפון</dt>
                    <dd>{lead.phone}</dd>
                  </div>
                  <div>
                    <dt>מייל</dt>
                    <dd>{lead.email}</dd>
                  </div>
                  <div>
                    <dt>מקור</dt>
                    <dd>{LEAD_SOURCE_LABELS[lead.source]}</dd>
                  </div>
                  <div>
                    <dt>תאריך</dt>
                    <dd>{formatDate(lead.createdAt)}</dd>
                  </div>
                </dl>
                <div className={styles.actions}>
                  <Link href={`/admin/leads/${lead.id}`} className={styles.linkButton}>
                    פתיחה
                  </Link>
                  <DeleteLeadButton
                    id={lead.id}
                    label={formatLeadNumber(lead.leadNumber)}
                  />
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
