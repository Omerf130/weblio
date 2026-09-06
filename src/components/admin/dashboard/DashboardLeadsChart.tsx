"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardDailyLeadPoint } from "@/types/dashboard";
import styles from "../DashboardContent.module.scss";

type DashboardLeadsChartProps = {
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

export default function DashboardLeadsChart({ data }: DashboardLeadsChartProps) {
  const hasData = data.some((point) => point.count > 0);

  return (
    <section className={styles.chartPanel} aria-label="לידים ב־30 הימים האחרונים">
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>לידים ב־30 הימים האחרונים</h3>
      </div>

      <div className={styles.chartWrap}>
        {!hasData ? (
          <p className={styles.emptyState}>עדיין אין לידים בתקופה זו.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="leadsAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(79, 127, 185, 0.32)" />
                  <stop offset="100%" stopColor="rgba(79, 127, 185, 0.04)" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#dde4ed" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                allowDecimals={false}
                width={28}
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: "rgba(79, 127, 185, 0.45)", strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#4f7fb9"
                strokeWidth={3}
                fill="url(#leadsAreaFill)"
                dot={false}
                activeDot={{ r: 5, fill: "#4f7fb9", stroke: "#ffffff", strokeWidth: 2.5 }}
                isAnimationActive
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
