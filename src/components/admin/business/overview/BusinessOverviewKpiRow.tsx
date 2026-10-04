import Link from "next/link";
import {
  MdInbox,
  MdMarkEmailUnread,
  MdRadar,
  MdTrendingUp,
  MdFiberNew,
  MdNotificationImportant,
} from "react-icons/md";
import { formatComparisonLabel } from "@/lib/admin/dashboard-stats";
import type { BusinessOverviewDashboardData } from "@/types/business";
import styles from "./BusinessOverview.module.scss";

type Props = {
  kpis: BusinessOverviewDashboardData["kpis"];
};

const KPI_ITEMS = [
  {
    key: "newLeads",
    href: "/admin/leads",
    label: "לידים חדשים",
    subtitle: "7 ימים אחרונים",
    icon: MdInbox,
    tone: "green",
    getValue: (k: Props["kpis"]) => k.newLeadsLast7Days,
    getComparison: (k: Props["kpis"]) => k.newLeadsComparison,
  },
  {
    key: "unread",
    href: "/admin/leads",
    label: "לידים שלא נקראו",
    subtitle: undefined,
    icon: MdMarkEmailUnread,
    tone: "blue",
    getValue: (k: Props["kpis"]) => k.unreadLeadCount,
    getComparison: () => null,
  },
  {
    key: "intents",
    href: "/admin/business/intent?status=new",
    label: "כוונות לסקירה",
    subtitle: undefined,
    icon: MdRadar,
    tone: "purple",
    getValue: (k: Props["kpis"]) => k.classifiedReviewIntentsCount,
    getComparison: () => null,
  },
  {
    key: "activeOpps",
    href: "/admin/business/opportunities",
    label: "הזדמנויות פעילות",
    subtitle: undefined,
    icon: MdTrendingUp,
    tone: "amber",
    getValue: (k: Props["kpis"]) => k.activeOpportunitiesCount,
    getComparison: () => null,
  },
  {
    key: "newOpps",
    href: "/admin/business/opportunities?status=new",
    label: "הזדמנויות חדשות",
    subtitle: "7 ימים אחרונים",
    icon: MdFiberNew,
    tone: "teal",
    getValue: (k: Props["kpis"]) => k.newOpportunitiesLast7Days,
    getComparison: () => null,
  },
  {
    key: "overdue",
    href: "/admin/business/follow-ups?filter=overdue",
    label: "מעקבים באיחור",
    subtitle: undefined,
    icon: MdNotificationImportant,
    tone: "red",
    getValue: (k: Props["kpis"]) => k.overdueFollowUpsCount,
    getComparison: () => null,
  },
] as const;

export default function BusinessOverviewKpiRow({ kpis }: Props) {
  return (
    <section className={styles.kpiRow} aria-label="מדדים עיקריים">
      {KPI_ITEMS.map((item) => {
        const Icon = item.icon;
        const value = item.getValue(kpis);
        const comparison = item.getComparison(kpis);
        const comparisonLabel = formatComparisonLabel(comparison);
        const isAlert = item.key === "overdue" && value > 0;

        return (
          <Link
            key={item.key}
            href={item.href}
            className={`${styles.kpiCard} ${isAlert ? styles.kpiCardAlert : ""} ${styles[`kpiCard_${item.tone}`]}`}
            aria-label={`${item.label}: ${value}`}
          >
            <span
              className={`${styles.kpiIcon} ${styles[`kpiIcon_${item.tone}`]}`}
              aria-hidden
            >
              <Icon />
            </span>
            <p className={styles.kpiValue}>{value}</p>
            <span className={styles.kpiLabel}>{item.label}</span>
            {item.subtitle ? (
              <span className={styles.kpiSubtitle}>{item.subtitle}</span>
            ) : null}
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
          </Link>
        );
      })}
    </section>
  );
}
