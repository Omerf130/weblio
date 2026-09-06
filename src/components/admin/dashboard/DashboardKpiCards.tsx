"use client";

import {
  MdInbox,
  MdCalendarToday,
  MdSummarize,
  MdWork,
} from "react-icons/md";
import {
  calculatePercentChange,
  formatComparisonLabel,
} from "@/lib/admin/dashboard-stats";
import type { DashboardStats } from "@/types/dashboard";
import styles from "../DashboardContent.module.scss";

type DashboardKpiCardsProps = {
  stats: DashboardStats;
};

const KPI_CONFIG = [
  {
    key: "leadsLast7Days",
    label: "לידים חדשים",
    icon: MdInbox,
    getValue: (stats: DashboardStats) => stats.leadsLast7Days,
    getComparison: () => null,
  },
  {
    key: "leadsThisMonth",
    label: "לידים החודש",
    icon: MdCalendarToday,
    getValue: (stats: DashboardStats) => stats.leadsThisMonth,
    getComparison: (stats: DashboardStats) =>
      calculatePercentChange(
        stats.leadsThisMonth,
        stats.leadsPreviousMonthSamePeriod
      ),
  },
  {
    key: "totalLeads",
    label: "סה״כ לידים",
    icon: MdSummarize,
    getValue: (stats: DashboardStats) => stats.totalLeads,
    getComparison: () => null,
  },
  {
    key: "totalProjects",
    label: "פרויקטים באתר",
    icon: MdWork,
    getValue: (stats: DashboardStats) => stats.totalProjects,
    getComparison: () => null,
  },
] as const;

export default function DashboardKpiCards({ stats }: DashboardKpiCardsProps) {
  return (
    <section className={styles.kpiGrid} aria-label="מדדי ביצוע">
      {KPI_CONFIG.map((kpi) => {
        const Icon = kpi.icon;
        const comparison = kpi.getComparison(stats);
        const comparisonLabel = formatComparisonLabel(comparison);

        return (
          <article key={kpi.key} className={styles.kpiCard}>
            <div className={styles.kpiTop}>
              <span className={styles.kpiIconWrap} aria-hidden>
                <Icon />
              </span>
              <span className={styles.kpiLabel}>{kpi.label}</span>
            </div>
            <p className={styles.kpiValue}>{kpi.getValue(stats)}</p>
            {comparisonLabel ? (
              <p
                className={`${styles.kpiComparison} ${
                  comparison?.direction === "up"
                    ? styles.kpiComparisonUp
                    : comparison?.direction === "down"
                      ? styles.kpiComparisonDown
                      : ""
                }`.trim()}
              >
                {comparisonLabel}
              </p>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
