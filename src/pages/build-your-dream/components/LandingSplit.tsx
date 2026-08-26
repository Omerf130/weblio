"use client";

import type {
  BuildYourDreamSplit,
  LandingImageData,
} from "@/lib/content/build-your-dream/types";
import Reveal from "@/components/motion/Reveal";
import LandingButton from "./LandingButton";
import LandingImage from "./LandingImage";
import LandingImageFrame from "./LandingImageFrame";
import LandingSection from "./LandingSection";
import styles from "./LandingSplit.module.scss";

type LandingSplitProps = {
  data: BuildYourDreamSplit;
  image: LandingImageData;
  sectionVariant?: "default" | "warm" | "accent" | "cream";
  frameVariant?: "editorial" | "tilted";
};

export default function LandingSplit({
  data,
  image,
  sectionVariant = "default",
  frameVariant = "editorial",
}: LandingSplitProps) {
  const titleId = `landing-split-${data.id}`;

  return (
    <LandingSection variant={sectionVariant} ariaLabelledBy={titleId}>
      <div className={`${styles.grid} ${data.reversed ? styles.reversed : ""}`.trim()}>
        <Reveal className={styles.visual}>
          <LandingImageFrame variant={frameVariant}>
            <LandingImage image={image} />
          </LandingImageFrame>
        </Reveal>

        <Reveal className={styles.copy} delay={0.08}>
          <span className={styles.accentLine} aria-hidden />
          <h2 id={titleId} className={styles.title}>
            {data.title}
          </h2>
          <p className={styles.text}>{data.text}</p>
          <LandingButton cta={data.cta} size="lg" />
        </Reveal>
      </div>
    </LandingSection>
  );
}
