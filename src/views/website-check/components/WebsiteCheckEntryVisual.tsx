"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ANALYZER_METRICS } from "@/components/analyzer/analyzer-content";
import AnalyzerDevice from "@/components/analyzer/AnalyzerDevice";
import AnalyzerScoreCard from "@/components/analyzer/AnalyzerScoreCard";
import "@/components/analyzer/WebsiteAnalyzer.scss";

export default function WebsiteCheckEntryVisual() {
  const prefersReducedMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const [floatEnabled, setFloatEnabled] = useState(false);
  const [stageVisible, setStageVisible] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1025px)");
    const sync = () => setFloatEnabled(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setStageVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const floatActive = floatEnabled && stageVisible && !prefersReducedMotion;

  return (
    <div className="website-check-entry__visual analyzer__visual">
      <div className="website-check-entry__stage-aura" aria-hidden />
      <div
        ref={stageRef}
        className={`analyzer-stage website-check-entry__stage${prefersReducedMotion ? "" : " analyzer-stage--live"}`}
      >
        <AnalyzerDevice />
        <ul className="analyzer-scores" aria-hidden>
          {ANALYZER_METRICS.map((metric, index) => (
            <AnalyzerScoreCard
              key={metric.id}
              metric={metric}
              index={index}
              revealed
              scoresActive
              floatActive={floatActive}
              floatEnabled={floatEnabled}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
