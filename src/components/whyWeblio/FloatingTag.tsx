import { motion, type MotionValue, useTransform } from "framer-motion";

type FloatingTagProps = {
  label: string;
  className: string;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  parallax?: boolean;
  depth?: number;
  showDot?: boolean;
};

export default function FloatingTag({
  label,
  className,
  mouseX,
  mouseY,
  parallax = false,
  depth = 1,
  showDot = false,
}: FloatingTagProps) {
  const x = useTransform(mouseX, [0, 1], [-10 * depth, 10 * depth]);
  const y = useTransform(mouseY, [0, 1], [-6 * depth, 6 * depth]);

  return (
    <motion.span
      className={`floating-tag ${className}`}
      style={parallax ? { x, y } : undefined}
      aria-hidden
    >
      {showDot ? <span className="floating-tag__dot" /> : null}
      {label}
    </motion.span>
  );
}
