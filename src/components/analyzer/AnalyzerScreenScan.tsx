"use client";

import { motion, useReducedMotion } from "framer-motion";

const SCAN_DURATION = 1.2;
const SCAN_EASE = [0.42, 0, 0.2, 1] as const;

type AnalyzerScreenScanProps = {
  active: boolean;
  onComplete: () => void;
};

export default function AnalyzerScreenScan({ active, onComplete }: AnalyzerScreenScanProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion || !active) {
    return null;
  }

  return (
    <div className="analyzer-screen-scan" aria-hidden>
      <motion.div
        className="analyzer-screen-scan__beam"
        initial={{ y: "-8%", opacity: 0 }}
        animate={{
          y: ["-8%", "108%"],
          opacity: [0, 1, 1, 0.85, 0],
        }}
        transition={{
          duration: SCAN_DURATION,
          ease: SCAN_EASE,
          times: [0, 0.08, 0.72, 0.92, 1],
        }}
        onAnimationComplete={onComplete}
      />
      <motion.div
        className="analyzer-screen-scan__wash"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.12, 0.06, 0] }}
        transition={{
          duration: SCAN_DURATION,
          ease: "linear",
          times: [0, 0.35, 0.75, 1],
        }}
      />
    </div>
  );
}

export { SCAN_DURATION };
