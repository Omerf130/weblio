"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { DashboardSourceSlice } from "@/types/dashboard";
import styles from "../DashboardContent.module.scss";

const SOURCE_COLORS: Record<string, string> = {
  website: "#4f7fb9",
  landingPage: "#20a4a8",
};

const FALLBACK_COLORS = ["#4f7fb9", "#20a4a8", "#608bc1", "#2d6a9f"];

type DashboardLeadSourcesProps = {
  sources: DashboardSourceSlice[];
};

function SourceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: DashboardSourceSlice & { fill: string } }[];
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const slice = payload[0].payload;

  return (
    <div className={styles.chartTooltip}>
      <span className={styles.chartTooltipLabel}>{slice.label}</span>
      <strong>{slice.count} לידים</strong>
    </div>
  );
}

export default function DashboardLeadSources({ sources }: DashboardLeadSourcesProps) {
  const total = sources.reduce((sum, slice) => sum + slice.count, 0);
  const chartData = sources.map((slice, index) => ({
    ...slice,
    fill:
      SOURCE_COLORS[slice.source] ??
      FALLBACK_COLORS[index % FALLBACK_COLORS.length],
  }));

  return (
    <section className={styles.sourcesPanel} aria-label="מקורות לידים">
      <h3 className={styles.panelTitle}>מקורות לידים</h3>

      {total === 0 ? (
        <p className={styles.emptyState}>אין נתוני מקורות להצגה.</p>
      ) : (
        <>
          <div className={styles.sourcesChartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="label"
                  innerRadius="58%"
                  outerRadius="82%"
                  paddingAngle={3}
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.source} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<SourceTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.sourcesCenterLabel}>
              <strong>{total}</strong>
              <span>לידים</span>
            </div>
          </div>

          <ul className={styles.sourcesLegend}>
            {chartData.map((slice) => (
              <li key={slice.source}>
                <span className={styles.sourcesLegendItem}>
                  <span
                    className={styles.sourcesLegendSwatch}
                    style={{ backgroundColor: slice.fill }}
                    aria-hidden
                  />
                  <span className={styles.sourcesLegendLabel}>{slice.label}</span>
                </span>
                <strong className={styles.sourcesLegendCount}>{slice.count}</strong>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
