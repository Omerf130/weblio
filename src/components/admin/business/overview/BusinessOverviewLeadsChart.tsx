"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardDailyLeadPoint } from "@/types/dashboard";
import styles from "./BusinessOverview.module.scss";

type Props = {
  data: DashboardDailyLeadPoint[];
};

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: DashboardDailyLeadPoint }[];
}) {
  if (!active || !payload?.length) {
    return null;
  }
  const point = payload[0].payload;
  return (
    <div className={styles.chartTooltip}>
      <span className={styles.chartTooltipLabel}>{point.label}</span>
      <strong>{point.count} לידים</strong>
    </div>
  );
}

export default function BusinessOverviewLeadsChart({ data }: Props) {
  const total = data.reduce((sum, point) => sum + point.count, 0);
  const summaryText = data
    .map((point) => `${point.label}: ${point.count}`)
    .join("، ");

  return (
    <section className={styles.panel} aria-labelledby="overview-leads-chart-title">
      <div className={styles.panelHeader}>
        <h2 id="overview-leads-chart-title" className={styles.panelTitle}>
          לידים חדשים — 7 ימים אחרונים
        </h2>
        <span className={styles.panelMeta}>סה״כ {total}</span>
      </div>
      <p className={styles.srOnly}>{summaryText}</p>
      {total === 0 ? (
        <p className={styles.emptyStateInline}>עדיין אין לידים בתקופה זו.</p>
      ) : (
        <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#d8e0ea" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#475569", fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={16}
              />
              <YAxis
                allowDecimals={false}
                width={28}
                tick={{ fill: "#475569", fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(79, 127, 185, 0.08)" }} />
              <Bar
                dataKey="count"
                fill="#3b6db5"
                radius={[6, 6, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
