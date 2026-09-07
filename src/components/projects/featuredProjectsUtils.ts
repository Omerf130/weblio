import type { PublicProjectDto } from "@/types/project";

export type StackPose = {
  /** Horizontal anchor within the scene box (percent) */
  left: number;
  /** Vertical anchor for desktop (percent from top) */
  top: number;
  /** Vertical anchor for mobile (percent from bottom) */
  bottom: number;
  /** Fine-tune translate (pixels) */
  x: number;
  y: number;
  rotate: number;
  rotateX: number;
  rotateY: number;
  scale: number;
  width: number;
  opacity: number;
  brightness: number;
  contrast: number;
  zIndex: number;
  blur: number;
  labelTop: string;
  labelLeft: string;
};

/**
 * Desktop resting poses — simple 2D staircase inside the scene box.
 * Depth from position, scale, small rotate, overlap, z-index, brightness.
 */
export const STACK_POSES: StackPose[] = [
  {
    left: 8,
    top: 36,
    bottom: 0,
    x: 0,
    y: 6,
    rotate: 7,
    rotateX: 0,
    rotateY: 0,
    scale: 0.95,
    width: 63,
    opacity: 1,
    brightness: 1,
    contrast: 1,
    zIndex: 40,
    blur: 0,
    labelTop: "-1.4rem",
    labelLeft: "0.5rem",
  },
  {
    left: 20,
    top: 24,
    bottom: 0,
    x: 4,
    y: 0,
    rotate: 5,
    rotateX: 0,
    rotateY: 0,
    scale: 0.89,
    width: 63,
    opacity: 1,
    brightness: 0.9,
    contrast: 1,
    zIndex: 30,
    blur: 0,
    labelTop: "-1.35rem",
    labelLeft: "0.5rem",
  },
  {
    left: 32,
    top: 14,
    bottom: 0,
    x: 6,
    y: -4,
    rotate: 3,
    rotateX: 0,
    rotateY: 0,
    scale: 0.83,
    width: 63,
    opacity: 1,
    brightness: 0.82,
    contrast: 1,
    zIndex: 20,
    blur: 0,
    labelTop: "-1.3rem",
    labelLeft: "0.5rem",
  },
  {
    left: 42,
    top: 5,
    bottom: 0,
    x: 8,
    y: -8,
    rotate: -1,
    rotateX: 0,
    rotateY: 0,
    scale: 0.76,
    width: 63,
    opacity: 1,
    brightness: 0.74,
    contrast: 1,
    zIndex: 10,
    blur: 0,
    labelTop: "-1.25rem",
    labelLeft: "0.5rem",
  },
];

export const MOBILE_STACK_POSES: StackPose[] = [
  {
    left: 50,
    top: 0,
    bottom: 0,
    x: 0,
    y: 0,
    rotate: 0,
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    width: 100,
    opacity: 1,
    brightness: 1,
    contrast: 1,
    zIndex: 2,
    blur: 0,
    labelTop: "0",
    labelLeft: "0",
  },
  {
    left: 50,
    top: 0,
    bottom: 0,
    x: 0,
    y: 0,
    rotate: -2.2,
    rotateX: 0,
    rotateY: 0,
    scale: 0.94,
    width: 88,
    opacity: 0.36,
    brightness: 0.85,
    contrast: 0.95,
    zIndex: 1,
    blur: 0.5,
    labelTop: "0",
    labelLeft: "0",
  },
];

export function getStackPosition(
  index: number,
  activeIndex: number,
  count: number
): number {
  return (index - activeIndex + count) % count;
}

export function getNextIndex(activeIndex: number, count: number): number {
  return (activeIndex + 1) % count;
}

export function getPreviousIndex(activeIndex: number, count: number): number {
  return (activeIndex - 1 + count) % count;
}

export function formatProgress(current: number, total: number): string {
  return `${String(current).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
}

export function formatProgressIndex(current: number): string {
  return String(current).padStart(2, "0");
}

export function formatStackLabel(stackPosition: number): string {
  return String(stackPosition + 1).padStart(2, "0");
}

export function getStackPose(stackPosition: number, mobile = false): StackPose {
  const poses = mobile ? MOBILE_STACK_POSES : STACK_POSES;
  return poses[Math.min(stackPosition, poses.length - 1)];
}

export function getActiveProject(
  projects: PublicProjectDto[],
  activeIndex: number
): PublicProjectDto {
  return projects[activeIndex];
}

export function getNextProject(
  projects: PublicProjectDto[],
  activeIndex: number
): PublicProjectDto | null {
  if (projects.length <= 1) return null;
  return projects[getNextIndex(activeIndex, projects.length)];
}

export function getPreviousProject(
  projects: PublicProjectDto[],
  activeIndex: number
): PublicProjectDto | null {
  if (projects.length <= 1) return null;
  return projects[getPreviousIndex(activeIndex, projects.length)];
}

export function getParallaxFactor(stackPosition: number): number {
  if (stackPosition === 0) return 1;
  if (stackPosition === 1) return 0.48;
  if (stackPosition === 2) return 0.26;
  return 0.12;
}

export function buildLayerFilter(pose: StackPose): string {
  const parts: string[] = [];
  if (pose.blur > 0) parts.push(`blur(${pose.blur}px)`);
  if (pose.brightness !== 1) parts.push(`brightness(${pose.brightness})`);
  if (pose.contrast !== 1) parts.push(`contrast(${pose.contrast})`);
  return parts.length > 0 ? parts.join(" ") : "none";
}
