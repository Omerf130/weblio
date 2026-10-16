"use client";

import Link from "next/link";
import {
  MdChevronLeft,
  MdDescription,
  MdGridView,
  MdTipsAndUpdates,
  MdVerifiedUser,
} from "react-icons/md";
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ANALYZER_CONTENT, ANALYZER_HIGHLIGHTS, ANALYZER_METRICS } from "./analyzer-content";
import AnalyzerDevice from "./AnalyzerDevice";
import AnalyzerScoreCard from "./AnalyzerScoreCard";
import AnalyzerScreenScan from "./AnalyzerScreenScan";
import { useAnalyzerExperience } from "./useAnalyzerExperience";
import "./WebsiteAnalyzer.scss";

const EASE_OUT_SOFT = [0.25, 0.46, 0.45, 0.94] as const;

const parentVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.06,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: EASE_OUT_SOFT },
  },
};

const HIGHLIGHT_ICONS = {
  "no-commitment": MdVerifiedUser,
  "clear-report": MdDescription,
  recommendations: MdTipsAndUpdates,
  "four-areas": MdGridView,
} as const;

export default function WebsiteAnalyzer() {
  const prefersReducedMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const stageInView = useInView(stageRef, { once: true, amount: 0.45, margin: "0px 0px -8% 0px" });
  const sectionVisible = useInView(sectionRef, { amount: 0.08 });

  const {
    scanActive,
    cardsRevealed,
    scoresActive,
    prefersReducedMotion: motionReduced,
    handleScanComplete,
  } = useAnalyzerExperience(stageInView);

  const [floatEnabled, setFloatEnabled] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1025px)");
    const sync = () => setFloatEnabled(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const floatActive = floatEnabled && sectionVisible && cardsRevealed;

  return (
    <section className="analyzer" id="analyzer" dir="rtl" ref={sectionRef}>
      <div className="analyzer__atmosphere" aria-hidden>
        <span className="analyzer__glow analyzer__glow--top" />
        <span className="analyzer__glow analyzer__glow--bottom" />
        <div className="analyzer__grid" />
      </div>

      <motion.div
        className="analyzer__inner"
        variants={prefersReducedMotion ? undefined : parentVariants}
        initial={prefersReducedMotion ? undefined : "hidden"}
        whileInView={prefersReducedMotion ? undefined : "visible"}
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div
          className="analyzer__content"
          variants={prefersReducedMotion ? undefined : itemVariants}
        >
          <span className="analyzer__eyebrow" dir="ltr">
            {ANALYZER_CONTENT.eyebrow}
          </span>

          <h2 className="analyzer__headline">
            {ANALYZER_CONTENT.headline}
          </h2>

          <p className="analyzer__subheadline">
            {ANALYZER_CONTENT.subheadline}
          </p>

          <p className="analyzer__description">
            {ANALYZER_CONTENT.description}
          </p>

          <Link href={ANALYZER_CONTENT.ctaHref} className="analyzer__cta-link">
            {ANALYZER_CONTENT.ctaLabel}
            <MdChevronLeft className="analyzer__cta-link-icon" aria-hidden />
          </Link>

          <ul className="analyzer__highlights" aria-label="יתרונות הבדיקה">
            {ANALYZER_HIGHLIGHTS.map((item) => {
              const Icon = HIGHLIGHT_ICONS[item.id];
              return (
                <li key={item.id} className="analyzer__highlight">
                  <Icon className="analyzer__highlight-icon" aria-hidden />
                  <span>{item.label}</span>
                </li>
              );
            })}
          </ul>
        </motion.div>

        <motion.div
          className="analyzer__visual"
          variants={prefersReducedMotion ? undefined : itemVariants}
        >
          <div
            className={`analyzer-stage${motionReduced ? "" : " analyzer-stage--live"}`}
            ref={stageRef}
          >
            <AnalyzerDevice />
            <AnalyzerScreenScan active={scanActive} onComplete={handleScanComplete} />
            <ul className="analyzer-scores" aria-hidden>
              {ANALYZER_METRICS.map((metric, index) => (
                <AnalyzerScoreCard
                  key={metric.id}
                  metric={metric}
                  index={index}
                  revealed={cardsRevealed}
                  scoresActive={scoresActive}
                  floatActive={floatActive}
                  floatEnabled={floatEnabled}
                />
              ))}
            </ul>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
