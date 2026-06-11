import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { CONSTS } from "../../consts";
import HeroBackground from "./HeroBackground";
import CodeCard from "./CodeCard";
import "./Hero.scss";

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

  // Mouse position normalised 0..1 relative to the hero, shared with bg + card
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      setInteractive(false);
      return;
    }
    const fine = window.matchMedia("(pointer: fine)").matches;
    setInteractive(fine);
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

      <div className="hero__inner">
        <motion.div
          className="hero__text"
          initial="hidden"
          animate="visible"
          variants={parentVariants}
        >
          <motion.span className="hero__eyebrow" variants={itemVariants}>
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

        <motion.div
          className="hero__visual"
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: EASE_OUT_SOFT }}
        >
          <CodeCard mouseX={mouseX} mouseY={mouseY} interactive={interactive} />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
