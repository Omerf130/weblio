"use client";

import type { CSSProperties, MouseEvent } from "react";
import { motion, type TargetAndTransition, type Transition } from "framer-motion";
import type { PublicProjectDto } from "@/types/project";
import { projectImageSrc, PROJECT_LINK_REL, projectHref } from "@/utils/projectLinks";
import {
  buildLayerFilter,
  formatStackLabel,
  getStackPose,
  type StackPose,
} from "./featuredProjectsUtils";

const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;
export const SCENE_DURATION = 0.88;

type MotionPose = {
  left: string;
  top?: string;
  bottom?: string;
  x: number | string;
  y: number;
  rotate: number;
  scale: number;
  opacity: number;
  width: string;
  filter: string;
  zIndex: number;
};

type ProjectStackLayerProps = {
  project: PublicProjectDto;
  stackPosition: number;
  previousStackPosition: number;
  isTransitioning: boolean;
  isFormerActive: boolean;
  isIncomingActive: boolean;
  isBackgroundShifter: boolean;
  reducedMotion: boolean;
  transitionDirection: TransitionDirection;
  mobile?: boolean;
};

function poseToMotion(pose: StackPose, mobile: boolean): MotionPose {
  if (mobile) {
    return {
      left: "50%",
      top: "0",
      x: "-50%",
      y: pose.y,
      rotate: pose.rotate,
      scale: pose.scale,
      opacity: pose.opacity,
      width: `${pose.width}%`,
      filter: buildLayerFilter(pose),
      zIndex: pose.zIndex,
    };
  }

  return {
    left: `${pose.left}%`,
    top: `${pose.top}%`,
    x: pose.x,
    y: pose.y,
    rotate: pose.rotate,
    scale: pose.scale,
    opacity: pose.opacity,
    width: `${pose.width}%`,
    filter: buildLayerFilter(pose),
    zIndex: pose.zIndex,
  };
}

/**
 * Outgoing active: FM animates current → outward waypoint → deepest target.
 * First keyframe is an outward point, NOT a repeat of the foreground pose.
 */
export type TransitionDirection = "forward" | "backward";

function buildFormerExitTarget(
  from: MotionPose,
  to: MotionPose,
  direction: TransitionDirection
): TargetAndTransition {
  const baseX = typeof from.x === "number" ? from.x : 0;
  const outwardY = from.y - 18;
  const outwardScale = from.scale * 0.9;
  const outwardX = direction === "forward" ? baseX + 40 : baseX - 40;
  const outwardRotate = direction === "forward" ? from.rotate + 2 : from.rotate - 2;

  return {
    left: to.left,
    top: to.top,
    bottom: to.bottom,
    width: to.width,
    opacity: to.opacity,
    x: [outwardX, to.x],
    y: [outwardY, to.y],
    rotate: [outwardRotate, to.rotate],
    scale: [outwardScale, to.scale],
    filter: to.filter,
    zIndex: to.zIndex,
  };
}

function sceneAnimate(
  fromPose: StackPose,
  toPose: StackPose,
  mobile: boolean,
  isTransitioning: boolean,
  isFormerActive: boolean,
  transitionDirection: TransitionDirection
): TargetAndTransition {
  const to = poseToMotion(toPose, mobile);

  if (!isTransitioning || mobile) {
    return to;
  }

  if (isFormerActive) {
    const from = poseToMotion(fromPose, mobile);
    return buildFormerExitTarget(from, to, transitionDirection);
  }

  return to;
}

function sceneTransition(
  reducedMotion: boolean,
  isTransitioning: boolean,
  isFormerActive: boolean,
  isIncomingActive: boolean,
  isBackgroundShifter: boolean
): Transition {
  if (reducedMotion) {
    return { duration: 0.2, ease: EASE_PREMIUM };
  }

  if (!isTransitioning) {
    return { duration: 0, ease: EASE_PREMIUM };
  }

  if (isFormerActive) {
    return {
      duration: SCENE_DURATION,
      ease: EASE_PREMIUM,
      times: [0.22, 1],
      filter: { duration: SCENE_DURATION * 0.72, ease: EASE_PREMIUM },
      zIndex: { duration: 0.32, delay: 0.1, ease: EASE_PREMIUM },
    };
  }

  if (isIncomingActive) {
    return {
      duration: SCENE_DURATION,
      ease: EASE_PREMIUM,
      filter: { duration: SCENE_DURATION * 0.75, delay: 0.04, ease: EASE_PREMIUM },
      zIndex: { duration: 0.34, delay: 0.06, ease: EASE_PREMIUM },
    };
  }

  if (isBackgroundShifter) {
    return {
      duration: SCENE_DURATION * 0.82,
      ease: EASE_PREMIUM,
      delay: 0.2,
      filter: { duration: SCENE_DURATION * 0.55, delay: 0.28, ease: EASE_PREMIUM },
      zIndex: { duration: 0.32, delay: 0.26, ease: EASE_PREMIUM },
    };
  }

  return {
    duration: SCENE_DURATION,
    ease: EASE_PREMIUM,
  };
}

export default function ProjectStackLayer({
  project,
  stackPosition,
  previousStackPosition,
  isTransitioning,
  isFormerActive,
  isIncomingActive,
  isBackgroundShifter,
  reducedMotion,
  transitionDirection,
  mobile = false,
}: ProjectStackLayerProps) {
  const toPose = getStackPose(stackPosition, mobile);
  const fromPose = getStackPose(previousStackPosition, mobile);

  const visualSlot = isTransitioning ? previousStackPosition : stackPosition;
  const depthClass = `featured-projects__layer--depth-${visualSlot}`;

  const showActiveChrome =
    (!isTransitioning && stackPosition === 0) ||
    (isTransitioning && isIncomingActive);

  const isInteractive = !isTransitioning && stackPosition === 0;

  const handleScreenClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isInteractive) {
      event.preventDefault();
    }
  };

  return (
    <motion.div
      className={`featured-projects__layer ${depthClass}${
        showActiveChrome ? " featured-projects__layer--active" : ""
      }${isTransitioning && isFormerActive ? " featured-projects__layer--exiting" : ""}${
        mobile ? " featured-projects__layer--mobile" : ""
      }`}
      data-depth={visualSlot}
      initial={false}
      animate={sceneAnimate(
        fromPose,
        toPose,
        mobile,
        isTransitioning,
        isFormerActive,
        transitionDirection
      )}
      transition={sceneTransition(
        reducedMotion,
        isTransitioning,
        isFormerActive,
        isIncomingActive,
        isBackgroundShifter
      )}
      style={{
        position: "absolute",
        pointerEvents: isInteractive ? "auto" : "none",
      } as CSSProperties}
      aria-hidden={!isInteractive && !isIncomingActive}
    >
      <div className="featured-projects__frame">
        {!showActiveChrome && !mobile && visualSlot > 0 ? (
          <span
            className="featured-projects__layer-label"
            style={{ top: toPose.labelTop, left: toPose.labelLeft }}
            aria-hidden
          >
            {formatStackLabel(visualSlot)}
          </span>
        ) : null}

        <div className="featured-projects__chrome" aria-hidden>
          <span className="featured-projects__chrome-dot" />
          <span className="featured-projects__chrome-dot" />
          <span className="featured-projects__chrome-dot" />
          <span className="featured-projects__chrome-bar" />
        </div>
        <div className="featured-projects__screen">
          <a
            className="featured-projects__screen-link"
            href={projectHref(project.projectUrl)}
            target="_blank"
            rel={PROJECT_LINK_REL}
            tabIndex={isInteractive ? 0 : -1}
            aria-label={isInteractive ? `פתיחת ${project.imageAlt}` : undefined}
            aria-hidden={!isInteractive}
            onClick={handleScreenClick}
          >
            <img
              className="featured-projects__screenshot"
              src={projectImageSrc(project.imageUrl)}
              alt={isInteractive ? project.imageAlt : ""}
              loading={isInteractive || isIncomingActive ? "eager" : "lazy"}
              fetchPriority={isInteractive || isIncomingActive ? "high" : "low"}
              decoding="async"
            />
          </a>
          <span className="featured-projects__screen-shine" aria-hidden />
          {showActiveChrome ? <span className="featured-projects__screen-edge" aria-hidden /> : null}
        </div>
      </div>

      {showActiveChrome && !mobile ? (
        <span className="featured-projects__floor-reflection" aria-hidden />
      ) : null}
    </motion.div>
  );
}
