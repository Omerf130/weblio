import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CONSTS } from "../../consts";
import { staggerItem, staggerParent } from "../motion/Reveal";
import MetricCounter from "./MetricCounter";
import "./Metrics.scss";

const FLOAT_CONFIG = [
  { duration: 6, delay: 0 },
  { duration: 7, delay: 0.4 },
  { duration: 8, delay: 0.2 },
  { duration: 9, delay: 0.6 },
];

const Metrics = () => {
  const { ITEMS } = CONSTS.METRICS;
  const reduceMotion = useReducedMotion();
  const [floatEnabled, setFloatEnabled] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      setFloatEnabled(false);
      return;
    }
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setFloatEnabled(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [reduceMotion]);

  return (
    <section
      className="metrics"
      id="metrics"
      dir="rtl"
      aria-label="Weblio key metrics"
    >
      <div className="metrics__bg" aria-hidden>
        <div className="metrics__orb metrics__orb--a" />
        <div className="metrics__orb metrics__orb--b" />
      </div>

      <motion.ul
        className="metrics__grid"
        variants={staggerParent}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {ITEMS.map((m, i) => {
          const cfg = FLOAT_CONFIG[i % FLOAT_CONFIG.length];
          return (
            <motion.li
              key={m.id}
              className="metrics__card"
              variants={staggerItem}
              animate={floatEnabled ? { y: [0, -8, 0] } : undefined}
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
              <div className="metrics__value">
                <MetricCounter
                  target={m.target}
                  suffix={m.suffix}
                  display={m.display}
                />
              </div>
              <div className="metrics__label">{m.label}</div>
            </motion.li>
          );
        })}
      </motion.ul>
    </section>
  );
};

export default Metrics;
