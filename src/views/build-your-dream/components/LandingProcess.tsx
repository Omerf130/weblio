"use client";

import { motion } from "framer-motion";
import type { BuildYourDreamProcess } from "@/lib/content/build-your-dream/types";
import Reveal, { staggerItem, staggerParent } from "@/components/motion/Reveal";
import LandingSection from "./LandingSection";
import styles from "./LandingProcess.module.scss";

type LandingProcessProps = {
  data: BuildYourDreamProcess;
};

export default function LandingProcess({ data }: LandingProcessProps) {
  return (
    <LandingSection variant="accent" ariaLabelledBy="landing-process-title">
      <Reveal as="header" className={styles.header}>
        <h2 id="landing-process-title" className={styles.title}>
          {data.title}
        </h2>
        <p className={styles.subtitle}>{data.subtitle}</p>
      </Reveal>

      <motion.ol
        className={styles.steps}
        variants={staggerParent}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {data.steps.map((step) => (
          <motion.li key={step.id} className={styles.step} variants={staggerItem}>
            <span className={styles.number}>{step.stepNumber}</span>
            <div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepText}>{step.text}</p>
            </div>
          </motion.li>
        ))}
      </motion.ol>
    </LandingSection>
  );
}
