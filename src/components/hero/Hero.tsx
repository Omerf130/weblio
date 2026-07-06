import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { CONSTS } from "../../consts";
import HeroBackground from "./HeroBackground";
import FloatingBrowser from "./FloatingBrowser";
import "./Hero.scss";

const Hero3DScene = lazy(() => import("./Hero3DScene"));

const EASE_OUT_SOFT = [0.25, 0.46, 0.45, 0.94] as const;

const parentVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT_SOFT },
  },
};

const Hero = () => {
  const { HERO } = CONSTS;
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);

  // Mouse position normalised 0..1 relative to the hero, shared with bg + card + 3D scene
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const [interactive, setInteractive] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      setInteractive(false);
    } else {
      setInteractive(window.matchMedia("(pointer: fine)").matches);
    }

    const mobileMq = window.matchMedia("(max-width: 767px)");
    const tabletMq = window.matchMedia("(max-width: 1200px)");

    const updateMobile = () => setIsMobile(mobileMq.matches);
    const updateTablet = () => setIsTablet(tabletMq.matches);

    updateMobile();
    updateTablet();

    mobileMq.addEventListener("change", updateMobile);
    tabletMq.addEventListener("change", updateTablet);

    return () => {
      mobileMq.removeEventListener("change", updateMobile);
      tabletMq.removeEventListener("change", updateTablet);
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!interactive) return;
    const el = sectionRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouseX.set(Math.min(1, Math.max(0, x)));
      mouseY.set(Math.min(1, Math.max(0, y)));
    };
    const onLeave = () => {
      mouseX.set(0.5);
      mouseY.set(0.5);
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [interactive, mouseX, mouseY]);

  return (
    <section className="hero" id="hero" ref={sectionRef} dir="rtl">
      <HeroBackground mouseX={mouseX} mouseY={mouseY} interactive={interactive} />

      <Suspense fallback={null}>
        <Hero3DScene
          mouseX={mouseX}
          mouseY={mouseY}
          interactive={interactive}
          simple={isTablet || isMobile}
          autoRotate={!interactive && !prefersReducedMotion}
          isMobile={isMobile}
        />
      </Suspense>

      <div className="hero__inner">
        <motion.div
          className="hero__text"
          initial="hidden"
          animate="visible"
          variants={parentVariants}
        >
          <motion.span className="hero__eyebrow" variants={itemVariants}>
            <motion.span
              className="hero__eyebrow-dot"
              aria-hidden
              animate={
                interactive
                  ? { opacity: [1, 0.4, 1], scale: [1, 0.85, 1] }
                  : undefined
              }
              transition={
                interactive
                  ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  : undefined
              }
            />
            {HERO.EYEBROW}
          </motion.span>
          <motion.h1 className="hero__title" variants={itemVariants}>
            {HERO.HEADLINE}
          </motion.h1>
          <motion.p className="hero__subtitle" variants={itemVariants}>
            {HERO.SUBTITLE}
          </motion.p>
          <motion.div className="hero__ctas" variants={itemVariants}>
            <a className="hero__cta hero__cta--primary" href="#contact">
              {HERO.CTA_PRIMARY}
            </a>
            <button
              type="button"
              className="hero__cta hero__cta--secondary"
              onClick={() => navigate("/projects")}
            >
              {HERO.CTA_SECONDARY}
            </button>
          </motion.div>
        </motion.div>

        <div className="hero__visual">
          <FloatingBrowser
            mouseX={mouseX}
            mouseY={mouseY}
            interactive={interactive}
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
