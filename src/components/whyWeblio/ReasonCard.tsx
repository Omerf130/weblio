import { useEffect, useRef, useState } from "react";
import { motion, type Variants } from "framer-motion";
import type { IconType } from "react-icons";
import { MdArrowBack } from "react-icons/md";

/** Opacity-only reveal so CSS hover transforms are not overridden by motion `y`. */
const reasonCardReveal: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

type ReasonCardProps = {
  id: string;
  number: string;
  title: string;
  body: string;
  Icon: IconType;
};

function bindReasonCardPointer(node: HTMLLIElement) {
  const reset = () => {
    node.style.setProperty("--tilt-x", "0deg");
    node.style.setProperty("--tilt-y", "0deg");
    node.style.setProperty("--shift-x", "0px");
    node.style.setProperty("--shift-y", "0px");
    node.style.setProperty("--para-x", "0");
    node.style.setProperty("--para-y", "0");
    node.style.setProperty("--pointer-x", "50%");
    node.style.setProperty("--pointer-y", "50%");
  };

  const onMove = (event: MouseEvent) => {
    const rect = node.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const paraX = (x - 0.5) * 2;
    const paraY = (y - 0.5) * 2;

    node.style.setProperty("--pointer-x", `${x * 100}%`);
    node.style.setProperty("--pointer-y", `${y * 100}%`);
    node.style.setProperty("--tilt-y", `${(x - 0.5) * 8}deg`);
    node.style.setProperty("--tilt-x", `${(0.5 - y) * 8}deg`);
    node.style.setProperty("--shift-x", `${(x - 0.5) * 8}px`);
    node.style.setProperty("--shift-y", `${(y - 0.5) * 8}px`);
    node.style.setProperty("--para-x", `${paraX}`);
    node.style.setProperty("--para-y", `${paraY}`);
  };

  node.addEventListener("mousemove", onMove);
  node.addEventListener("mouseleave", reset);

  return () => {
    node.removeEventListener("mousemove", onMove);
    node.removeEventListener("mouseleave", reset);
    reset();
  };
}

export default function ReasonCard({ id, number, title, body, Icon }: ReasonCardProps) {
  const cardRef = useRef<HTMLLIElement>(null);
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    const pointerMq = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1025px)");
    const reducedMotionMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = () => {
      setInteractive(pointerMq.matches && !reducedMotionMq.matches);
    };

    update();
    pointerMq.addEventListener("change", update);
    reducedMotionMq.addEventListener("change", update);

    return () => {
      pointerMq.removeEventListener("change", update);
      reducedMotionMq.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!interactive || !cardRef.current) return;
    return bindReasonCardPointer(cardRef.current);
  }, [interactive]);

  return (
    <motion.li
      ref={cardRef}
      className={`why-weblio__reason why-weblio__reason--${id}${
        interactive ? " why-weblio__reason--interactive" : ""
      }`}
      variants={reasonCardReveal}
      tabIndex={0}
    >
      <span className="why-weblio__reason-spotlight" aria-hidden />

      <div className="why-weblio__reason-mark" aria-hidden>
        <span className="why-weblio__reason-number">{number}</span>
        <span className="why-weblio__reason-icon">
          <Icon />
        </span>
      </div>

      <div className="why-weblio__reason-copy">
        <h3 className="why-weblio__reason-title">{title}</h3>
        <p className="why-weblio__reason-body">{body}</p>
      </div>

      <span className="why-weblio__reason-arrow" aria-hidden>
        <MdArrowBack />
      </span>
    </motion.li>
  );
}
