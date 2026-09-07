"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicProjectDto } from "@/types/project";
import { getStackPosition } from "./featuredProjectsUtils";
import ProjectStackLayer, { SCENE_DURATION, type TransitionDirection } from "./ProjectStackLayer";

type ProjectVisualStackProps = {
  projects: PublicProjectDto[];
  activeIndex: number;
  isTransitioning: boolean;
  reducedMotion: boolean;
  transitionDirection?: TransitionDirection;
  mobile?: boolean;
};

function bindStackPointer(node: HTMLDivElement) {
  const reset = () => {
    node.style.setProperty("--para-x", "0");
    node.style.setProperty("--para-y", "0");
  };

  const onMove = (event: MouseEvent) => {
    const rect = node.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    node.style.setProperty("--para-x", `${x * 12}px`);
    node.style.setProperty("--para-y", `${y * 9}px`);
  };

  node.addEventListener("mousemove", onMove);
  node.addEventListener("mouseleave", reset);

  return () => {
    node.removeEventListener("mousemove", onMove);
    node.removeEventListener("mouseleave", reset);
    reset();
  };
}

export default function ProjectVisualStack({
  projects,
  activeIndex,
  isTransitioning,
  reducedMotion,
  transitionDirection = "forward",
  mobile = false,
}: ProjectVisualStackProps) {
  const stackRef = useRef<HTMLDivElement>(null);
  const [pointerEnabled, setPointerEnabled] = useState(false);
  const prevActiveIndexRef = useRef(activeIndex);
  const formerActiveIndexRef = useRef(activeIndex);
  const count = projects.length;

  const formerActiveIndex = formerActiveIndexRef.current;

  useEffect(() => {
    if (activeIndex !== prevActiveIndexRef.current) {
      formerActiveIndexRef.current = prevActiveIndexRef.current;
      prevActiveIndexRef.current = activeIndex;
    }
  }, [activeIndex]);

  useEffect(() => {
    if (mobile || reducedMotion) {
      setPointerEnabled(false);
      return;
    }

    const pointerMq = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1025px)");
    const update = () => setPointerEnabled(pointerMq.matches);
    update();
    pointerMq.addEventListener("change", update);
    return () => pointerMq.removeEventListener("change", update);
  }, [mobile, reducedMotion]);

  useEffect(() => {
    if (!pointerEnabled || !stackRef.current) return;
    return bindStackPointer(stackRef.current);
  }, [pointerEnabled]);

  return (
    <div
      ref={stackRef}
      className={`featured-projects__stack${pointerEnabled ? " featured-projects__stack--interactive" : ""}${
        mobile ? " featured-projects__stack--mobile" : ""
      }`}
    >
      <div className="featured-projects__stack-glow" aria-hidden />
      <div className="featured-projects__stack-floor" aria-hidden />
      <div className="featured-projects__stack-grid" aria-hidden />
      {!mobile ? (
        <>
          <span className="featured-projects__scene-arc featured-projects__scene-arc--a" aria-hidden />
        </>
      ) : null}
      <div className="featured-projects__stack-stage">
        {projects.map((project, index) => {
          const stackPosition = getStackPosition(index, activeIndex, count);
          const previousStackPosition = isTransitioning
            ? getStackPosition(index, formerActiveIndex, count)
            : stackPosition;
          const isFormerActive = isTransitioning && index === formerActiveIndex;
          const isIncomingActive = isTransitioning && index === activeIndex && !isFormerActive;
          const isBackgroundShifter =
            isTransitioning && !isFormerActive && !isIncomingActive;

          if (mobile && stackPosition > 1) return null;

          return (
            <ProjectStackLayer
              key={project.id}
              project={project}
              stackPosition={stackPosition}
              previousStackPosition={previousStackPosition}
              isTransitioning={isTransitioning}
              isFormerActive={isFormerActive}
              isIncomingActive={isIncomingActive}
              isBackgroundShifter={isBackgroundShifter}
              reducedMotion={reducedMotion}
              transitionDirection={transitionDirection}
              mobile={mobile}
            />
          );
        })}
      </div>
    </div>
  );
}

export { SCENE_DURATION };
