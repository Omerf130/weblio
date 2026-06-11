import type { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

const EASE_OUT_SOFT = [0.25, 0.46, 0.45, 0.94] as const;

export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT_SOFT },
  },
};

export const staggerParent: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE_OUT_SOFT },
  },
};

type RevealTag = "div" | "section" | "header" | "h1" | "h2" | "h3" | "p" | "ul" | "li" | "span";

type Props = {
  as?: RevealTag;
  delay?: number;
  y?: number;
  once?: boolean;
  amount?: number;
  className?: string;
  id?: string;
  children: ReactNode;
};

const Reveal = ({
  as = "div",
  delay = 0,
  y = 28,
  once = true,
  amount = 0.2,
  className,
  id,
  children,
}: Props) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    const Tag = as;
    return (
      <Tag className={className} id={id}>
        {children}
      </Tag>
    );
  }

  const Component = motion[as] as typeof motion.div;

  return (
    <Component
      className={className}
      id={id}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration: 0.7, ease: EASE_OUT_SOFT, delay }}
    >
      {children}
    </Component>
  );
};

export default Reveal;
