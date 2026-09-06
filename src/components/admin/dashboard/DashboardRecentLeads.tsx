"use client";

import Link from "next/link";
import { formatIsraelDateTime } from "@/lib/admin/dashboard-time";
import { LEAD_SOURCE_LABELS } from "@/lib/leads/rules";
import LeadStatusBadge from "@/components/admin/leads/LeadStatusBadge";
import type { DashboardLeadSummary } from "@/types/dashboard";
import styles from "../DashboardContent.module.scss";

type DashboardRecentLeadsProps = {
  leads: DashboardLeadSummary[];
};

export default function DashboardRecentLeads({ leads }: DashboardRecentLeadsProps) {
  return (
    <section className={styles.recentLeadsPanel} aria-label="לידים אחרונים">
      <div className={styles.panelHeaderRow}>
        <h3 className={styles.panelTitle}>לידים אחרונים</h3>
        <Link href="/admin/leads" className={styles.panelLink}>
          צפייה בכל הלידים
        </Link>
      </div>

      {leads.length === 0 ? (
        <p className={styles.emptyState}>עדיין לא התקבלו לידים.</p>
      ) : (
        <>
          <div className={styles.leadsTableWrap}>
            <table className={styles.leadsTable}>
              <thead>
                <tr>
                  <th scope="col">שם</th>
                  <th scope="col">מקור</th>
                  <th scope="col">טלפון</th>
                  <th scope="col">סטטוס</th>
                  <th scope="col">תאריך</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <Link href={`/admin/leads/${lead.id}`} className={styles.leadNameLink}>
                        {lead.name}
                      </Link>
                    </td>
                    <td>{LEAD_SOURCE_LABELS[lead.source]}</td>
                    <td dir="ltr">{lead.phone}</td>
                    <td>
                      <LeadStatusBadge status={lead.status} />
                    </td>
                    <td>{formatIsraelDateTime(lead.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.leadsMobileList}>
            {leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/admin/leads/${lead.id}`}
                className={styles.leadMobileCard}
              >
                <div className={styles.leadMobileTop}>
                  <strong>{lead.name}</strong>
                  <LeadStatusBadge status={lead.status} />
                </div>
                <div className={styles.leadMobileMeta}>
                  <span>{LEAD_SOURCE_LABELS[lead.source]}</span>
                  <span dir="ltr">{lead.phone}</span>
                  <span>{formatIsraelDateTime(lead.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
