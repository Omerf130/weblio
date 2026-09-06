"use client";

import Link from "next/link";
import { MdCampaign, MdEdit, MdOpenInNew } from "react-icons/md";
import type { DashboardLandingSummary } from "@/types/dashboard";
import styles from "../DashboardContent.module.scss";

type DashboardLandingWidgetProps = {
  landing: DashboardLandingSummary;
};

export default function DashboardLandingWidget({
  landing,
}: DashboardLandingWidgetProps) {
  return (
    <section className={styles.landingPanel} aria-label="דף הנחיתה">
      <div className={styles.landingTop}>
        <div className={styles.landingHeading}>
          <span className={styles.landingIconWrap} aria-hidden>
            <MdCampaign />
          </span>
          <div>
            <h3 className={styles.panelTitle}>דף הנחיתה</h3>
            <p className={styles.landingSubtitle}>{landing.heroTitle}</p>
          </div>
        </div>

        {landing.heroImageUrl ? (
          <div className={styles.landingPreviewWrap}>
            <img
              src={landing.heroImageUrl}
              alt={landing.heroImageAlt}
              className={styles.landingPreview}
              loading="lazy"
            />
          </div>
        ) : null}
      </div>

      <div className={styles.landingStats}>
        <div>
          <span className={styles.landingStatLabel}>סה״כ לידים מהדף</span>
          <strong className={styles.landingStatValue}>{landing.totalLeads}</strong>
        </div>
        <div>
          <span className={styles.landingStatLabel}>לידים ב־7 ימים</span>
          <strong className={styles.landingStatValue}>{landing.leadsLast7Days}</strong>
        </div>
      </div>

      <div className={styles.landingActions}>
        <Link href="/admin/landing-page" className={styles.landingAction}>
          <MdEdit aria-hidden />
          <span>עריכת דף הנחיתה</span>
        </Link>
        <a
          href="/build-your-dream"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.landingActionSecondary}
        >
          <MdOpenInNew aria-hidden />
          <span>צפייה בדף</span>
        </a>
      </div>
    </section>
  );
}
