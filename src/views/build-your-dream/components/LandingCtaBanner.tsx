"use client";



import type { BuildYourDreamCtaBanner } from "@/lib/content/build-your-dream/types";

import Reveal from "@/components/motion/Reveal";

import LandingButton from "./LandingButton";

import LandingSection from "./LandingSection";

import styles from "./LandingCtaBanner.module.scss";



type LandingCtaBannerProps = {

  data: BuildYourDreamCtaBanner;

};



export default function LandingCtaBanner({ data }: LandingCtaBannerProps) {

  return (

    <LandingSection variant="banner" density="tight" ariaLabelledBy="landing-cta-banner-title">

      <Reveal className={styles.inner}>

        <h2 id="landing-cta-banner-title" className={styles.title}>

          {data.title}

        </h2>

        <p className={styles.text}>{data.text}</p>

        <LandingButton cta={data.cta} size="lg" variant="onBanner" />

      </Reveal>

    </LandingSection>

  );

}

