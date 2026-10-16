"use client";

import type { WebsiteAnalysisRunStatus } from "@/types/website-analysis-run";
import styles from "./WebsiteCheckRunsManager.module.scss";

type WebsiteCheckRunStatusBadgeProps = {
  status: WebsiteAnalysisRunStatus;
  label: string;
};

export default function WebsiteCheckRunStatusBadge({
  status,
  label,
}: WebsiteCheckRunStatusBadgeProps) {
  const tone =
    status === "failed"
      ? styles.badgeFailed
      : status === "queued" || status === "running"
        ? styles.badgeRunning
        : status === "partial"
          ? styles.badgePartial
          : styles.badgeCompleted;

  return (
    <span className={`${styles.badge} ${tone}`}>
      {label}
    </span>
  );
}
