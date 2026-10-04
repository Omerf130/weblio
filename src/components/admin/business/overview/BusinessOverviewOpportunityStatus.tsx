"use client";

import Link from "next/link";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { OPPORTUNITY_STATUS_LABELS } from "@/lib/business/opportunities/rules";
import type { OperationalOpportunityStatusCount } from "@/types/business";
import styles from "./BusinessOverview.module.scss";

const STATUS_COLORS: Record<
  OperationalOpportunityStatusCount["status"],
  string
> = {
  new: "#3b6db5",
  researching: "#e8940a",
  contacted: "#5b54e8",
};

type Props = {
  counts: OperationalOpportunityStatusCount[];
};

type ChartSlice = OperationalOpportunityStatusCount & {
  label: string;
  fill: string;
};

function StatusTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ChartSlice }[];
}) {
  if (!active || !payload?.length) {
    return null;
  }
  const slice = payload[0].payload;
  return (
    <div className={styles.chartTooltip}>
      <span>{slice.label}</span>
      <strong>{slice.count}</strong>
    </div>
  );
}

export default function BusinessOverviewOpportunityStatus({ counts }: Props) {
  const chartData: ChartSlice[] = counts.map((row) => ({
    ...row,
    label: OPPORTUNITY_STATUS_LABELS[row.status],
    fill: STATUS_COLORS[row.status],
  }));
  const total = chartData.reduce((sum, row) => sum + row.count, 0);
  const summaryText = chartData
    .map((row) => `${row.label}: ${row.count}`)
    .join("، ");

  return (
    <section className={styles.panel} aria-labelledby="overview-opp-status-title">
      <div className={styles.panelHeader}>
        <h2 id="overview-opp-status-title" className={styles.panelTitle}>
          הזדמנויות לפי סטטוס
        </h2>
      </div>
      <p className={styles.srOnly}>{summaryText || "אין הזדמנויות פעילות"}</p>

      {total === 0 ? (
        <p className={styles.emptyState}>אין הזדמנויות פעילות כרגע</p>
      ) : (
        <div className={styles.oppStatusBody}>
          <div className={styles.oppChartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="label"
                  innerRadius="58%"
                  outerRadius="82%"
                  paddingAngle={2}
                  isAnimationActive={false}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.status} fill={entry.fill} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<StatusTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <span className={styles.oppChartCenter} aria-hidden>
              {total}
            </span>
          </div>
          <ul className={styles.oppLegend}>
            {chartData.map((row) => (
              <li key={row.status}>
                <Link
                  href={`/admin/business/opportunities?status=${row.status}`}
                  className={styles.oppLegendLink}
                >
                  <span
                    className={styles.oppLegendSwatch}
                    style={{ backgroundColor: row.fill }}
                    aria-hidden
                  />
                  <span className={styles.oppLegendLabel}>{row.label}</span>
                  <span className={styles.oppLegendCount}>{row.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className={styles.panelFootnote}>לא כולל הומר לליד / נדחה</p>
    </section>
  );
}
