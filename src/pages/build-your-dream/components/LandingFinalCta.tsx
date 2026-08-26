"use client";

import type { BuildYourDreamFinalCta } from "@/lib/content/build-your-dream/types";
import Reveal from "@/components/motion/Reveal";
import LandingButton from "./LandingButton";
import LandingSection from "./LandingSection";
import styles from "./LandingFinalCta.module.scss";

type LandingFinalCtaProps = {
  data: BuildYourDreamFinalCta;
};

export default function LandingFinalCta({ data }: LandingFinalCtaProps) {
  return (
    <LandingSection variant="champagne" density="tight" ariaLabelledBy="landing-final-cta-title">
      <Reveal className={styles.inner}>
        <h2 id="landing-final-cta-title" className={styles.title}>
          {data.title}
        </h2>
        <p className={styles.text}>{data.text}</p>
        <LandingButton cta={data.cta} size="lg" />
      </Reveal>
    </LandingSection>
  );
}
