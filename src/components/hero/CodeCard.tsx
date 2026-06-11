import { motion, useSpring, useTransform, type MotionValue } from "framer-motion";
import "./CodeCard.scss";

type Props = {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  interactive: boolean;
};

const SPRING = { stiffness: 120, damping: 18, mass: 0.6 };

const CodeCard = ({ mouseX, mouseY, interactive }: Props) => {
  const tiltXRaw = useTransform(mouseY, (v) => (v - 0.5) * -8);
  const tiltYRaw = useTransform(mouseX, (v) => (v - 0.5) * 10);
  const translateXRaw = useTransform(mouseX, (v) => (v - 0.5) * -12);
  const translateYRaw = useTransform(mouseY, (v) => (v - 0.5) * -10);

  const rotateX = useSpring(tiltXRaw, SPRING);
  const rotateY = useSpring(tiltYRaw, SPRING);
  const x = useSpring(translateXRaw, SPRING);
  const y = useSpring(translateYRaw, SPRING);

  const style = interactive
    ? { rotateX, rotateY, x, y, transformPerspective: 900 }
    : undefined;

  return (
    <motion.div className="code-card" style={style} dir="ltr">
      <div className="code-card__chrome">
        <span className="code-card__dot code-card__dot--red" />
        <span className="code-card__dot code-card__dot--yellow" />
        <span className="code-card__dot code-card__dot--green" />
        <span className="code-card__filename">project.ts</span>
      </div>

      <pre className="code-card__code">
        <code>
          <span className="tok-line">
            <span className="tok-kw">const</span>{" "}
            <span className="tok-var">project</span>{" "}
            <span className="tok-punc">=</span>{" "}
            <span className="tok-punc">{"{"}</span>
          </span>
          <span className="tok-line tok-indent">
            <span className="tok-prop">design</span>
            <span className="tok-punc">:</span>{" "}
            <span className="tok-str">"modern"</span>
            <span className="tok-punc">,</span>
          </span>
          <span className="tok-line tok-indent">
            <span className="tok-prop">performance</span>
            <span className="tok-punc">:</span>{" "}
            <span className="tok-str">"fast"</span>
            <span className="tok-punc">,</span>
          </span>
          <span className="tok-line tok-indent">
            <span className="tok-prop">responsive</span>
            <span className="tok-punc">:</span>{" "}
            <span className="tok-bool">true</span>
            <span className="tok-punc">,</span>
          </span>
          <span className="tok-line tok-indent">
            <span className="tok-prop">seo</span>
            <span className="tok-punc">:</span>{" "}
            <span className="tok-bool">true</span>
            <span className="tok-punc">,</span>
          </span>
          <span className="tok-line">
            <span className="tok-punc">{"}"}</span>
          </span>
        </code>
      </pre>
    </motion.div>
  );
};

export default CodeCard;
