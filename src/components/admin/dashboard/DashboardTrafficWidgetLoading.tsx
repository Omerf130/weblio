import styles from "../DashboardContent.module.scss";

export default function DashboardTrafficWidgetLoading() {
  return (
    <section
      className={styles.trafficPanel}
      aria-label="תנועת גולשים"
      aria-busy="true"
    >
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>תנועת גולשים</h3>
      </div>
      <div className={styles.trafficMetrics}>
        <div className={styles.trafficMetric} aria-hidden>
          <span className={styles.trafficMetricLabel}>מבקרים השבוע</span>
          <span className={styles.trafficLoadingValue} />
        </div>
        <div className={styles.trafficMetric} aria-hidden>
          <span className={styles.trafficMetricLabel}>מבקרים החודש</span>
          <span className={styles.trafficLoadingValue} />
        </div>
      </div>
    </section>
  );
}
