"use client";

import { useState } from "react";
import type { BuildYourDreamFaq } from "@/lib/content/build-your-dream/types";
import Reveal from "@/components/motion/Reveal";
import LandingSection from "./LandingSection";
import styles from "./LandingFaq.module.scss";

type LandingFaqProps = {
  data: BuildYourDreamFaq;
};

export default function LandingFaq({ data }: LandingFaqProps) {
  const [openId, setOpenId] = useState<string | null>(data.items[0]?.id ?? null);

  return (
    <LandingSection variant="default" density="tight" ariaLabelledBy="landing-faq-title">
      <Reveal as="h2" id="landing-faq-title" className={styles.title}>
        {data.title}
      </Reveal>

      <div className={styles.list}>
        {data.items.map((item) => {
          const isOpen = openId === item.id;
          const panelId = `faq-panel-${item.id}`;
          const buttonId = `faq-button-${item.id}`;

          return (
            <article key={item.id} className={styles.item}>
              <button
                id={buttonId}
                type="button"
                className={styles.question}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenId(isOpen ? null : item.id)}
                suppressHydrationWarning
              >
                {item.question}
              </button>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={`${styles.answer} ${isOpen ? styles.answerOpen : ""}`.trim()}
              >
                <p>{item.answer}</p>
              </div>
            </article>
          );
        })}
      </div>
    </LandingSection>
  );
}
