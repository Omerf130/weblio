import { motion, useTransform, type MotionValue } from "framer-motion";
import "./FloatingBrowser.scss";

type Props = {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  interactive: boolean;
};

const EASE_OUT_SOFT = [0.25, 0.46, 0.45, 0.94] as const;

const FloatingBrowser = ({ mouseX, mouseY, interactive }: Props) => {
  const rotateY = useTransform(mouseX, [0, 1], [-10, 10]);
  const rotateX = useTransform(mouseY, [0, 1], [8, -8]);
  const translateX = useTransform(mouseX, [0, 1], [-6, 6]);
  const translateY = useTransform(mouseY, [0, 1], [-4, 4]);

  return (
    <motion.div
      className="floating-browser"
      style={
        interactive
          ? { rotateX, rotateY, x: translateX, y: translateY }
          : undefined
      }
      initial={{ opacity: 0, y: 36 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.8, ease: EASE_OUT_SOFT }}
    >
      <div className="floating-browser__chrome" dir="ltr" aria-hidden>
        <span className="floating-browser__dot floating-browser__dot--red" />
        <span className="floating-browser__dot floating-browser__dot--yellow" />
        <span className="floating-browser__dot floating-browser__dot--green" />
        <span className="floating-browser__url">weblio.co.il</span>
      </div>

      <div className="floating-browser__body" dir="ltr" aria-hidden>
        <pre className="floating-browser__code">
          <code>
            <span className="tok-cmt">{"// building your homepage…"}</span>
            {"\n"}
            <span className="tok-kw">const</span>
            <span className="tok-plain">{" hero = "}</span>
            <span className="tok-punct">{"{"}</span>
            {"\n"}
            {"  "}
            <span className="tok-prop">headline</span>
            <span className="tok-punct">: </span>
            <span className="tok-str">{'"Grow your business online"'}</span>
            <span className="tok-punct">,</span>
            {"\n"}
            {"  "}
            <span className="tok-prop">cta</span>
            <span className="tok-punct">: </span>
            <span className="tok-str">{'"Get Started"'}</span>
            <span className="tok-punct">,</span>
            {"\n"}
            {"  "}
            <span className="tok-prop">animate</span>
            <span className="tok-punct">: </span>
            <span className="tok-kw">true</span>
            {"\n"}
            <span className="tok-punct">{"};"}</span>
            {"\n"}
            <span className="tok-kw">export default</span>
            <span className="tok-plain">{" render(hero);"}</span>
          </code>
        </pre>

        <div className="floating-browser__divider">
          <motion.span
            className="floating-browser__live-dot"
            animate={
              interactive
                ? { opacity: [1, 0.35, 1], scale: [1, 0.9, 1] }
                : undefined
            }
            transition={
              interactive
                ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
                : undefined
            }
          />
          <span className="floating-browser__live-label">Live preview</span>
        </div>

        <div className="floating-browser__preview">
          <h3 className="floating-browser__preview-headline">
            Grow your business online
          </h3>
          <button
            className="floating-browser__cta"
            type="button"
            tabIndex={-1}
            aria-hidden
          >
            Get Started
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default FloatingBrowser;
