"use client";

import { MdInsights } from "react-icons/md";
import type { Ga4TrafficSummary } from "@/types/dashboard";
import styles from "../DashboardContent.module.scss";

type DashboardTrafficWidgetProps = {
  traffic: Ga4TrafficSummary;
};

export default function DashboardTrafficWidget({
  traffic,
}: DashboardTrafficWidgetProps) {
  const isConnected = traffic.status === "connected";

  return (
    <section className={styles.trafficPanel} aria-label="תנועת גולשים">
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>תנועת גולשים</h3>
      </div>

      {isConnected ? (
        <div className={styles.trafficMetrics}>
          <div className={styles.trafficMetric}>
            <span className={styles.trafficMetricLabel}>מבקרים השבוע</span>
            <strong className={styles.trafficMetricValue}>
              {traffic.weekVisitors ?? "—"}
            </strong>
          </div>
          <div className={styles.trafficMetric}>
            <span className={styles.trafficMetricLabel}>מבקרים החודש</span>
            <strong className={styles.trafficMetricValue}>
              {traffic.monthVisitors ?? "—"}
            </strong>
          </div>
        </div>
      ) : (
        <div className={styles.trafficUnavailable}>
          <span className={styles.trafficUnavailableIcon} aria-hidden>
            <MdInsights />
          </span>
          <p className={styles.trafficUnavailableTitle}>
            נתוני התנועה עדיין לא מחוברים
          </p>
          <p className={styles.trafficUnavailableText}>
            מעקב GA4 פעיל באתר. חיבור ל-Data API יאפשר הצגת מבקרים כאן.
          </p>
        </div>
      )}
    </section>
  );
}
