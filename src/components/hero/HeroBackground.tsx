import { motion, useMotionTemplate, useTransform, type MotionValue } from "framer-motion";
import "./HeroBackground.scss";

type Props = {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  interactive: boolean;
};

const EASE_FLOAT = [0.45, 0, 0.55, 1] as const;

const HeroBackground = ({ mouseX, mouseY, interactive }: Props) => {
  const spotlightX = useTransform(mouseX, (v) => `${v * 100}%`);
  const spotlightY = useTransform(mouseY, (v) => `${v * 100}%`);
  const spotlight = useMotionTemplate`radial-gradient(circle 420px at ${spotlightX} ${spotlightY}, rgba(96, 139, 193, 0.22), transparent 65%)`;

  const shapeAX = useTransform(mouseX, (v) => (v - 0.5) * 28);
  const shapeAY = useTransform(mouseY, (v) => (v - 0.5) * 28);
  const shapeBX = useTransform(mouseX, (v) => (v - 0.5) * -22);
  const shapeBY = useTransform(mouseY, (v) => (v - 0.5) * -18);
  const shapeCX = useTransform(mouseX, (v) => (v - 0.5) * 14);
  const shapeCY = useTransform(mouseY, (v) => (v - 0.5) * 14);

  return (
    <div className="hero-bg" aria-hidden>
      <div className="hero-bg__grid" />
      <div className="hero-bg__glow" />
      {interactive && (
        <motion.div className="hero-bg__spotlight" style={{ background: spotlight }} />
      )}
      <motion.div
        className="hero-bg__shape hero-bg__shape--a"
        style={interactive ? { x: shapeAX, y: shapeAY } : undefined}
        animate={{ translateY: [0, -14, 0], translateX: [0, 8, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: EASE_FLOAT }}
      />
      <motion.div
        className="hero-bg__shape hero-bg__shape--b"
        style={interactive ? { x: shapeBX, y: shapeBY } : undefined}
        animate={{ translateY: [0, 18, 0], translateX: [0, -10, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: EASE_FLOAT, delay: 1.2 }}
      />
      <motion.div
        className="hero-bg__shape hero-bg__shape--c"
        style={interactive ? { x: shapeCX, y: shapeCY } : undefined}
        animate={{ translateY: [0, -10, 0], translateX: [0, 12, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: EASE_FLOAT, delay: 0.6 }}
      />
    </div>
  );
};

export default HeroBackground;
