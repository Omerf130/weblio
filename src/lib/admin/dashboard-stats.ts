import { LEAD_SOURCE_LABELS } from "@/lib/leads/rules";
import {
  buildIsraelDateKeys,
  formatIsraelDayLabel,
  getIsraelDaysAgo,
} from "@/lib/admin/dashboard-time";
import type {
  DashboardDailyLeadPoint,
  DashboardKpiComparison,
  DashboardSourceSlice,
} from "@/types/dashboard";
import type { LeadSource } from "@/types/lead";

export function buildDailyLeadSeries(
  countsByDate: Record<string, number>,
  reference = new Date(),
  days = 30
): DashboardDailyLeadPoint[] {
  const start = getIsraelDaysAgo(days - 1, reference);
  const dateKeys = buildIsraelDateKeys(start, days);

  return dateKeys.map((date) => ({
    date,
    label: formatIsraelDayLabel(date),
    count: countsByDate[date] ?? 0,
  }));
}

export function buildSourceBreakdown(
  counts: Partial<Record<LeadSource, number>>
): DashboardSourceSlice[] {
  return (Object.keys(LEAD_SOURCE_LABELS) as LeadSource[])
    .map((source) => ({
      source,
      label: LEAD_SOURCE_LABELS[source],
      count: counts[source] ?? 0,
    }))
    .filter((slice) => slice.count > 0);
}

export function calculatePercentChange(
  current: number,
  previous: number
): DashboardKpiComparison {
  if (previous === 0) {
    return null;
  }

  const raw = ((current - previous) / previous) * 100;
  const percentChange = Math.round(raw);

  if (percentChange === 0) {
    return { percentChange: 0, direction: "flat" };
  }

  return {
    percentChange: Math.abs(percentChange),
    direction: percentChange > 0 ? "up" : "down",
  };
}

export function aggregateCountsByDate(
  rows: { _id: string; count: number }[]
): Record<string, number> {
  return rows.reduce<Record<string, number>>((accumulator, row) => {
    accumulator[row._id] = row.count;
    return accumulator;
  }, {});
}

export function aggregateSourceCounts(
  rows: { _id: LeadSource; count: number }[]
): Partial<Record<LeadSource, number>> {
  return rows.reduce<Partial<Record<LeadSource, number>>>((accumulator, row) => {
    accumulator[row._id] = row.count;
    return accumulator;
  }, {});
}

export function formatComparisonLabel(comparison: DashboardKpiComparison): string | null {
  if (!comparison) {
    return null;
  }

  if (comparison.direction === "flat") {
    return "ללא שינוי לעומת התקופה הקודמת";
  }

  const arrow = comparison.direction === "up" ? "↑" : "↓";
  return `${arrow} ${comparison.percentChange}% לעומת התקופה הקודמת`;
}
