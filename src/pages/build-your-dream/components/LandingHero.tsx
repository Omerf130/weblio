"use client";

import type {
  BuildYourDreamHero as HeroData,
  LandingImageData,
} from "@/lib/content/build-your-dream/types";
import Reveal from "@/components/motion/Reveal";
import LandingButton from "./LandingButton";
import LandingImage from "./LandingImage";
import LandingImageFrame from "./LandingImageFrame";
import styles from "./LandingHero.module.scss";

type LandingHeroProps = {
  data: HeroData;
  image: LandingImageData;
};

export default function LandingHero({ data, image }: LandingHeroProps) {
  return (
    <section className={styles.hero} aria-labelledby="landing-hero-title">
      <div className={styles.bgGlow} aria-hidden />

      <div className={styles.grid}>
        <div className={styles.copy}>
          <Reveal as="p" className={styles.eyebrow}>
            {data.eyebrow}
          </Reveal>
          <Reveal as="h1" id="landing-hero-title" className={styles.title} delay={0.05}>
            {data.title}
          </Reveal>
          <Reveal as="p" className={styles.subtitle} delay={0.1}>
            {data.subtitle}
          </Reveal>
          <Reveal className={styles.ctas} delay={0.15}>
            <LandingButton cta={data.ctaPrimary} size="lg" />
            <LandingButton cta={data.ctaSecondary} variant="secondary" size="lg" />
          </Reveal>
        </div>

        <Reveal className={styles.visual} delay={0.1}>
          <LandingImageFrame variant="hero">
            <LandingImage image={image} />
          </LandingImageFrame>
        </Reveal>
      </div>
    </section>
  );
}
