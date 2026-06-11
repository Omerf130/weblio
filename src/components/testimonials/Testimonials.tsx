import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FaQuoteRight } from "react-icons/fa6";
import { CONSTS } from "../../consts";
import Reveal, { staggerItem, staggerParent } from "../motion/Reveal";
import "./Testimonials.scss";

const FLOAT_CONFIG = [
  { duration: 7, delay: 0, amplitude: 10 },
  { duration: 9, delay: 0.6, amplitude: 14 },
  { duration: 8, delay: 0.3, amplitude: 12 },
  { duration: 10, delay: 0.9, amplitude: 16 },
];

const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => Array.from(w)[0] ?? "")
    .join("");

const Testimonials = () => {
  const { TITLE, SUBTITLE, ITEMS } = CONSTS.TESTIMONIALS;
  const prefersReducedMotion = useReducedMotion();
  const [floatEnabled, setFloatEnabled] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      setFloatEnabled(false);
      return;
    }
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setFloatEnabled(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [prefersReducedMotion]);

  return (
    <section
      className="testimonials"
      id="testimonials"
      dir="rtl"
      aria-labelledby="testimonials-heading"
    >
      <Reveal as="header" className="testimonials__header">
        <h2 id="testimonials-heading" className="testimonials__title">
          {TITLE}
        </h2>
        <p className="testimonials__subtitle">{SUBTITLE}</p>
      </Reveal>

      <motion.ul
        className="testimonials__grid"
        variants={staggerParent}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        {ITEMS.map((t, i) => {
          const cfg = FLOAT_CONFIG[i % FLOAT_CONFIG.length];
          return (
            <motion.li
              key={t.id}
              className={`testimonials__card testimonials__card--${i % 4}`}
              variants={staggerItem}
              animate={
                floatEnabled ? { y: [0, -cfg.amplitude, 0] } : undefined
              }
              transition={
                floatEnabled
                  ? {
                      duration: cfg.duration,
                      delay: cfg.delay,
                      repeat: Infinity,
                      repeatType: "mirror",
                      ease: "easeInOut",
                    }
                  : undefined
              }
            >
              <FaQuoteRight className="testimonials__quote" aria-hidden />
              <p className="testimonials__text">{t.text}</p>
              <div className="testimonials__person">
                <span className="testimonials__avatar" aria-hidden>
                  {getInitials(t.name)}
                </span>
                <div className="testimonials__meta">
                  <div className="testimonials__name">{t.name}</div>
                  <div className="testimonials__role">{t.role}</div>
                </div>
              </div>
            </motion.li>
          );
        })}
      </motion.ul>
    </section>
  );
};

export default Testimonials;
