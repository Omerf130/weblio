import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

const COUNT_DURATION = 1.8;
const COUNT_EASE = [0.16, 1, 0.3, 1] as const;

export type MetricCounterProps = {
  target: number | null;
  suffix: string;
  display: string | null;
  valueClassName?: string;
  numberClassName?: string;
  suffixClassName?: string;
};

export default function MetricCounter({
  target,
  suffix,
  display,
  valueClassName = "metrics__value-text",
  numberClassName = "metrics__value-number",
  suffixClassName = "metrics__suffix",
}: MetricCounterProps) {
  const numberRef = useRef<HTMLSpanElement>(null);
  const viewRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(viewRef, { once: true, margin: "-15%" });
  const reduceMotion = useReducedMotion();
  const isNumeric = target != null;

  useEffect(() => {
    if (!isNumeric || !inView || !numberRef.current) return;
    if (reduceMotion) {
      numberRef.current.textContent = String(target);
      return;
    }
    const controls = animate(0, target as number, {
      duration: COUNT_DURATION,
      ease: COUNT_EASE,
      onUpdate: (v) => {
        if (numberRef.current) {
          numberRef.current.textContent = Math.round(v).toString();
        }
      },
    });
    return () => controls.stop();
  }, [isNumeric, inView, target, reduceMotion]);

  useEffect(() => {
    if (!isNumeric || inView) return;
    const t = window.setTimeout(() => {
      if (numberRef.current) {
        numberRef.current.textContent = String(target);
      }
    }, 2500);
    return () => window.clearTimeout(t);
  }, [isNumeric, inView, target]);

  if (!isNumeric) {
    return (
      <span
        ref={viewRef}
        className={valueClassName}
        aria-label={display ?? undefined}
      >
        <span className={numberClassName}>{display}</span>
      </span>
    );
  }

  return (
    <span
      ref={viewRef}
      className={valueClassName}
      aria-label={`${target}${suffix}`}
    >
      <span ref={numberRef} className={numberClassName}>
        0
      </span>
      <span className={suffixClassName} aria-hidden>
        {suffix}
      </span>
    </span>
  );
}
