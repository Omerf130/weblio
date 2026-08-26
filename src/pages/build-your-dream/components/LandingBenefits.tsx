"use client";

import { motion } from "framer-motion";
import type { BuildYourDreamBenefits } from "@/lib/content/build-your-dream/types";
import Reveal, { staggerItem, staggerParent } from "@/components/motion/Reveal";
import BenefitIcon from "./BenefitIcon";
import LandingButton from "./LandingButton";
import LandingSection from "./LandingSection";
import styles from "./LandingBenefits.module.scss";

type LandingBenefitsProps = {
  data: BuildYourDreamBenefits;
};

export default function LandingBenefits({ data }: LandingBenefitsProps) {
  return (
    <LandingSection variant="warm" density="default" ariaLabelledBy="landing-benefits-title">
      <Reveal as="header" className={styles.header}>
        <h2 id="landing-benefits-title" className={styles.title}>
          {data.title}
        </h2>
        <p className={styles.subtitle}>{data.subtitle}</p>
      </Reveal>

      <motion.ul
        className={styles.grid}
        variants={staggerParent}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        {data.items.map((item) => (
          <motion.li key={item.id} className={styles.card} variants={staggerItem}>
            <span className={styles.iconWrap}>
              <BenefitIcon name={item.icon} />
            </span>
            <h3 className={styles.cardTitle}>{item.title}</h3>
            <p className={styles.cardText}>{item.text}</p>
          </motion.li>
        ))}
      </motion.ul>

      <Reveal className={styles.ctaWrap}>
        <LandingButton cta={data.cta} size="lg" />
      </Reveal>
    </LandingSection>
  );
}
