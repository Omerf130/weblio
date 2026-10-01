"use client";

import { MARKETING_HUB_PURPOSE_CARDS } from "@/lib/business/ai-marketing/purpose-ui";
import type { HubMarketingPurpose } from "@/lib/business/ai-marketing/types";
import styles from "./AiMarketingTools.module.scss";

type AiMarketingHubProps = {
  onSelectPurpose: (purpose: HubMarketingPurpose) => void;
};

export default function AiMarketingHub({ onSelectPurpose }: AiMarketingHubProps) {
  return (
    <section className={styles.panel} aria-labelledby="ai-marketing-hub">
      <h2 id="ai-marketing-hub" className={styles.hubHeading}>
        מה תרצה ליצור?
      </h2>
      <div className={styles.hubGrid}>
        {MARKETING_HUB_PURPOSE_CARDS.map((card) => (
          <button
            key={card.purpose}
            type="button"
            className={styles.purposeCard}
            onClick={() => onSelectPurpose(card.purpose)}
          >
            <span className={styles.purposeCardLabel}>{card.label}</span>
            <span className={styles.purposeCardDescription}>
              {card.description}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
