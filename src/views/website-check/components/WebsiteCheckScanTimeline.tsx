"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MdAccessibility, MdBolt, MdDesktopMac, MdSearch } from "react-icons/md";
import {
  SCAN_DEMO_STAGES,
  type ScanDemoStageVisualStatus,
} from "@/lib/website-check/scan-demo-sequence";

const STAGE_ICONS = {
  performance: MdBolt,
  seo: MdSearch,
  accessibility: MdAccessibility,
  ux: MdDesktopMac,
} as const;

type WebsiteCheckScanTimelineProps = {
  stageStatuses: ScanDemoStageVisualStatus[];
  progress: number;
  indeterminateBeam?: boolean;
};

export default function WebsiteCheckScanTimeline({
  stageStatuses,
  progress,
  indeterminateBeam = false,
}: WebsiteCheckScanTimelineProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="website-check-scanning__timeline" aria-hidden>
      <div className="website-check-scanning__timeline-track">
        <span className="website-check-scanning__timeline-beam" aria-hidden>
          <span className="website-check-scanning__timeline-beam-halo" />
          <span className="website-check-scanning__timeline-beam-core">
            <span
              className={`website-check-scanning__timeline-beam-fill${indeterminateBeam ? " website-check-scanning__timeline-beam-fill--indeterminate" : ""}`}
              style={
                indeterminateBeam
                  ? undefined
                  : { width: `${Math.min(100, Math.max(0, progress))}%` }
              }
            />
          </span>
        </span>
        {SCAN_DEMO_STAGES.map((stage, index) => {
          const status = stageStatuses[index] ?? "pending";
          const Icon = STAGE_ICONS[stage.id];
          const isActive = status === "active";

          return (
            <div
              key={stage.id}
              className={`website-check-scanning__timeline-step website-check-scanning__timeline-step--${stage.accent} website-check-scanning__timeline-step--${status}`}
            >
              <motion.div
                className="website-check-scanning__timeline-node"
                animate={
                  !prefersReducedMotion && isActive ? { scale: [1, 1.045, 1] } : { scale: 1 }
                }
                transition={
                  !prefersReducedMotion && isActive
                    ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0 }
                }
              >
                <span className="website-check-scanning__timeline-node-halo" aria-hidden />
                <span className="website-check-scanning__timeline-node-ring" aria-hidden />
                <span className="website-check-scanning__timeline-node-core">
                  <Icon className="website-check-scanning__timeline-icon" aria-hidden />
                </span>
              </motion.div>

              <span className="website-check-scanning__timeline-label">{stage.shortLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
