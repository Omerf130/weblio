"use client";

import { animate, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { IconType } from "react-icons";
import { MdAccessibilityNew, MdDevices, MdSearch } from "react-icons/md";
import type { AnalyzerMetric } from "./analyzer-content";
import { useAnimatedScoreDisplay } from "./useAnimatedScoreDisplay";
import "./WebsiteAnalyzer.scss";

const METRIC_ICONS: Partial<Record<AnalyzerMetric["id"], IconType>> = {
  seo: MdSearch,
  accessibility: MdAccessibilityNew,
  ux: MdDevices,
};

const REVEAL_EASE = [0.25, 0.46, 0.45, 0.94] as const;
const CARD_STAGGER_S = 0.09;
const SCORE_COUNT_DURATION = 0.6;
const CARD_REVEAL_DURATION = 0.33;

function ScoreRing({
  score,
  active,
  delay,
}: {
  score: number;
  active: boolean;
  delay: number;
}) {
  const radius = 15.5;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (score / 100) * circumference;
  const circleRef = useRef<SVGCircleElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const circle = circleRef.current;
    if (!circle) return;

    if (prefersReducedMotion || !active) {
      circle.style.strokeDashoffset = String(prefersReducedMotion ? targetOffset : circumference);
      return;
    }

    circle.style.strokeDashoffset = String(circumference);
    let controls: { stop: () => void } | undefined;
    const timeout = window.setTimeout(() => {
      const state = { offset: circumference };
      controls = animate(state, { offset: targetOffset }, {
        duration: SCORE_COUNT_DURATION,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: () => {
          circle.style.strokeDashoffset = String(state.offset);
        },
      });
    }, delay * 1000);

    return () => {
      window.clearTimeout(timeout);
      controls?.stop();
    };
  }, [active, circumference, targetOffset, delay, prefersReducedMotion]);

  return (
    <svg className="analyzer-score__ring" viewBox="0 0 40 40" aria-hidden>
      <circle className="analyzer-score__ring-track" cx="20" cy="20" r={radius} />
      <circle
        ref={circleRef}
        className="analyzer-score__ring-value"
        cx="20"
        cy="20"
        r={radius}
        strokeDasharray={circumference}
        strokeDashoffset={circumference}
      />
    </svg>
  );
}

type AnalyzerScoreCardProps = {
  metric: AnalyzerMetric;
  index: number;
  revealed: boolean;
  scoresActive: boolean;
  floatActive: boolean;
  floatEnabled: boolean;
};

export default function AnalyzerScoreCard({
  metric,
  index,
  revealed,
  scoresActive,
  floatActive,
  floatEnabled,
}: AnalyzerScoreCardProps) {
  const Icon = METRIC_ICONS[metric.id];
  const isPerformance = metric.id === "performance";
  const prefersReducedMotion = useReducedMotion();
  const revealDelay = prefersReducedMotion ? 0 : index * CARD_STAGGER_S;
  const scoreRef = useAnimatedScoreDisplay(
    metric.score,
    scoresActive,
    SCORE_COUNT_DURATION,
    revealDelay,
  );
  const ringScoreRef = useAnimatedScoreDisplay(
    metric.score,
    scoresActive && isPerformance,
    SCORE_COUNT_DURATION,
    revealDelay,
  );
  const canFloat = floatEnabled && revealed && !prefersReducedMotion;
  const floatClass = [
    "analyzer-score__float",
    canFloat ? `analyzer-score__float--${metric.id}` : "",
    canFloat && !floatActive ? "analyzer-score__float--paused" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li
      className={`analyzer-score analyzer-score--${metric.id} analyzer-score--${metric.accent}`}
    >
      <motion.div
        className="analyzer-score__reveal"
        initial={false}
        animate={
          revealed
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: 14 }
        }
        transition={{
          duration: prefersReducedMotion ? 0 : CARD_REVEAL_DURATION,
          delay: revealDelay,
          ease: REVEAL_EASE,
        }}
      >
        <div className={floatClass}>
          <article className="analyzer-score__panel">
            {isPerformance ? (
              <div className="analyzer-score__ring-wrap">
                <ScoreRing score={metric.score} active={scoresActive} delay={revealDelay} />
                <span className="analyzer-score__value" dir="ltr" ref={ringScoreRef}>
                  {prefersReducedMotion || !scoresActive ? metric.score : 0}
                </span>
              </div>
            ) : (
              <span className="analyzer-score__mark">
                {Icon ? <Icon className="analyzer-score__icon" aria-hidden /> : null}
              </span>
            )}

            <div className="analyzer-score__copy">
              {isPerformance ? null : (
                <span className="analyzer-score__value" dir="ltr" ref={scoreRef}>
                  {prefersReducedMotion || !scoresActive ? metric.score : 0}
                </span>
              )}
              <p className="analyzer-score__label" dir={metric.id === "seo" ? "ltr" : undefined}>
                {metric.label}
              </p>
            </div>
          </article>
        </div>
      </motion.div>
    </li>
  );
}
