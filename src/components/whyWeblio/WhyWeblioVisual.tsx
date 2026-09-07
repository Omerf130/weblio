import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import FloatingTag from "./FloatingTag";
import FloatingUIPanel from "./FloatingUIPanel";
import LaptopComposition from "./LaptopComposition";
import SceneDecor from "./SceneDecor";
import SceneEnvironment from "./SceneEnvironment";
import "./WhyWeblio.scss";

const EASE_OUT_SOFT = [0.25, 0.46, 0.45, 0.94] as const;

const DEEP_PANELS = [
  {
    variant: "design" as const,
    className: "ui-panel--workspace-deep",
    shape: "landscape" as const,
    depthTier: "far" as const,
    depth: 0.12,
    delay: 0.5,
  },
] as const;

const MID_PANELS = [
  {
    variant: "performance" as const,
    className: "ui-panel--perf-mid",
    shape: "landscape" as const,
    depthTier: "back" as const,
    depth: 0.2,
    delay: 0.66,
  },
] as const;

const TAGS = [
  { label: "Design", className: "floating-tag--design", depth: 0.52, showDot: true },
  { label: "Performance", className: "floating-tag--performance", depth: 0.46, showDot: false },
  { label: "SEO", className: "floating-tag--seo", depth: 0.4, showDot: false },
] as const;

export default function WhyWeblioVisual() {
  const prefersReducedMotion = useReducedMotion();
  const sceneRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const laptopX = useTransform(mouseX, [0, 1], [-2, 2]);
  const laptopY = useTransform(mouseY, [0, 1], [-1.2, 1.2]);

  const [interactive, setInteractive] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      setInteractive(false);
      return;
    }

    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const compactMq = window.matchMedia("(max-width: 1024px)");

    const update = () => {
      setIsCompact(compactMq.matches);
      setInteractive(finePointer && !compactMq.matches);
    };

    update();
    compactMq.addEventListener("change", update);
    return () => compactMq.removeEventListener("change", update);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!interactive || !sceneRef.current) return;

    const node = sceneRef.current;
    const handleMove = (event: MouseEvent) => {
      const rect = node.getBoundingClientRect();
      mouseX.set((event.clientX - rect.left) / rect.width);
      mouseY.set((event.clientY - rect.top) / rect.height);
    };

    node.addEventListener("mousemove", handleMove);
    return () => node.removeEventListener("mousemove", handleMove);
  }, [interactive, mouseX, mouseY]);

  return (
    <div className="why-weblio__hero-world why-weblio__hero-world--scene" ref={sceneRef} aria-hidden>
      <SceneEnvironment />

      <SceneDecor layer="back" />

      <div className="why-weblio__panels-deep">
        {DEEP_PANELS.map((panel) => (
          <FloatingUIPanel
            key={panel.className}
            variant={panel.variant}
            className={panel.className}
            shape={panel.shape}
            depthTier={panel.depthTier}
            mouseX={mouseX}
            mouseY={mouseY}
            parallax={interactive}
            depth={panel.depth}
            delay={prefersReducedMotion ? 0 : panel.delay}
          />
        ))}
      </div>

      <div className="why-weblio__panels-back">
        {MID_PANELS.map((panel) => (
          <FloatingUIPanel
            key={panel.className}
            variant={panel.variant}
            className={panel.className}
            shape={panel.shape}
            depthTier={panel.depthTier}
            mouseX={mouseX}
            mouseY={mouseY}
            parallax={interactive}
            depth={panel.depth}
            delay={prefersReducedMotion ? 0 : panel.delay}
          />
        ))}
      </div>

      <motion.div
        className="why-weblio__laptop-stage"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
        whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.9, delay: 0.35, ease: EASE_OUT_SOFT }}
        style={interactive ? { x: laptopX, y: laptopY } : undefined}
      >
        <LaptopComposition />
      </motion.div>

      <SceneDecor layer="front" />

      {!isCompact ? (
        <>
          <p className="why-weblio__editorial why-weblio__editorial--results why-weblio__editorial--handwritten" aria-hidden>
            <span>Better</span>
            <span>Websites</span>
            <span>Bigger</span>
            <span>Results</span>
          </p>

          <div className="why-weblio__tags-layer">
            {TAGS.map((tag) => (
              <FloatingTag
                key={tag.label}
                label={tag.label}
                className={tag.className}
                mouseX={mouseX}
                mouseY={mouseY}
                parallax={interactive}
                depth={tag.depth}
                showDot={tag.showDot}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
