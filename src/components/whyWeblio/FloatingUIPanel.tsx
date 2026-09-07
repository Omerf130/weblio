import {
  motion,
  motionValue,
  useReducedMotion,
  type MotionValue,
  useTransform,
} from "framer-motion";

export type FloatingPanelVariant =
  | "performance"
  | "design"
  | "development"
  | "responsive"
  | "seo";

export type FloatingPanelShape = "landscape" | "portrait" | "device" | "compact";

export type FloatingPanelDepth = "far" | "back" | "mid" | "front";

type FloatingUIPanelProps = {
  variant: FloatingPanelVariant;
  className: string;
  shape?: FloatingPanelShape;
  depthTier?: FloatingPanelDepth;
  mouseX?: MotionValue<number>;
  mouseY?: MotionValue<number>;
  parallax?: boolean;
  depth?: number;
  delay?: number;
};

const NEUTRAL_MOUSE = motionValue(0.5);

function PerformanceVisual() {
  return (
    <div className="ui-panel__viz ui-panel__viz--performance" aria-hidden>
      <div className="ui-panel__perf-grid">
        {Array.from({ length: 5 }).map((_, index) => (
          <span key={index} />
        ))}
      </div>
      <div className="ui-panel__perf-bars">
        <span style={{ height: "38%" }} />
        <span style={{ height: "62%" }} />
        <span style={{ height: "48%" }} />
        <span style={{ height: "78%" }} />
        <span style={{ height: "54%" }} />
        <span style={{ height: "66%" }} />
      </div>
      <div className="ui-panel__perf-footer">
        <span className="ui-panel__perf-dot" />
        <span className="ui-panel__perf-caption">Signal</span>
      </div>
    </div>
  );
}

function DesignVisual() {
  return (
    <div className="ui-panel__viz ui-panel__viz--design" aria-hidden>
      <div className="ui-panel__design-toolbar">
        <span />
        <span />
        <span />
      </div>
      <div className="ui-panel__design-canvas">
        <div className="ui-panel__design-hero" />
        <div className="ui-panel__design-row">
          <span />
          <span />
        </div>
        <div className="ui-panel__design-grid">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="ui-panel__design-sidebar">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

function DevelopmentVisual() {
  return (
    <div className="ui-panel__viz ui-panel__viz--development" aria-hidden>
      <div className="ui-panel__dev-gutter">
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
        <span>5</span>
      </div>
      <div className="ui-panel__dev-lines">
        <span className="ui-panel__dev-line ui-panel__dev-line--keyword" />
        <span className="ui-panel__dev-line" />
        <span className="ui-panel__dev-line ui-panel__dev-line--indent" />
        <span className="ui-panel__dev-line ui-panel__dev-line--short" />
        <span className="ui-panel__dev-line ui-panel__dev-line--indent" />
        <span className="ui-panel__dev-bracket">{`{`}</span>
        <span className="ui-panel__dev-line ui-panel__dev-line--indent2" />
        <span className="ui-panel__dev-bracket">{`}`}</span>
      </div>
    </div>
  );
}

function ResponsiveVisual() {
  return (
    <div className="ui-panel__viz ui-panel__viz--device" aria-hidden>
      <div className="ui-panel__device-frame">
        <div className="ui-panel__device-notch" />
        <div className="ui-panel__device-screen">
          <span className="ui-panel__device-block ui-panel__device-block--wide" />
          <span className="ui-panel__device-block" />
          <span className="ui-panel__device-block" />
          <span className="ui-panel__device-block ui-panel__device-block--cta" />
          <div className="ui-panel__device-scroll">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}

function SeoVisual() {
  return (
    <div className="ui-panel__viz ui-panel__viz--seo" aria-hidden>
      <div className="ui-panel__seo-search">
        <span className="ui-panel__seo-icon" />
        <span className="ui-panel__seo-field" />
      </div>
      <div className="ui-panel__seo-results">
        <span />
        <span />
        <span />
      </div>
      <div className="ui-panel__seo-chart">
        <svg viewBox="0 0 80 28" preserveAspectRatio="none" aria-hidden>
          <path
            d="M 0 22 L 14 18 L 28 20 L 42 12 L 56 14 L 70 6 L 80 8"
            fill="none"
            stroke="rgba(120, 180, 255, 0.55)"
            strokeWidth="1.5"
          />
          <path
            d="M 0 22 L 14 18 L 28 20 L 42 12 L 56 14 L 70 6 L 80 8 L 80 28 L 0 28 Z"
            fill="url(#ui-panel-seo-fill)"
            opacity="0.35"
          />
          <defs>
            <linearGradient id="ui-panel-seo-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(96, 139, 193, 0.45)" />
              <stop offset="100%" stopColor="rgba(96, 139, 193, 0)" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function PanelVisual({ variant }: { variant: FloatingPanelVariant }) {
  switch (variant) {
    case "performance":
      return <PerformanceVisual />;
    case "design":
      return <DesignVisual />;
    case "development":
      return <DevelopmentVisual />;
    case "responsive":
      return <ResponsiveVisual />;
    case "seo":
      return <SeoVisual />;
  }
}

export default function FloatingUIPanel({
  variant,
  className,
  shape = "landscape",
  depthTier = "mid",
  mouseX,
  mouseY,
  parallax = false,
  depth = 1,
  delay = 0,
}: FloatingUIPanelProps) {
  const prefersReducedMotion = useReducedMotion();
  const sourceX = mouseX ?? NEUTRAL_MOUSE;
  const sourceY = mouseY ?? NEUTRAL_MOUSE;
  const x = useTransform(sourceX, [0, 1], [-12 * depth, 12 * depth]);
  const y = useTransform(sourceY, [0, 1], [-7 * depth, 7 * depth]);

  const showLabel = depthTier === "front" || depthTier === "mid";

  return (
    <motion.div
      className={`ui-panel ui-panel--${variant} ui-panel--shape-${shape} ui-panel--tier-${depthTier}${prefersReducedMotion ? "" : " ui-panel--drift"} ${className}`}
      style={parallax ? { x, y } : undefined}
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.85, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      aria-hidden
    >
      <span className="ui-panel__ambient" aria-hidden />
      <div className="ui-panel__surface">
        <span className="ui-panel__rim ui-panel__rim--top" aria-hidden />
        <span className="ui-panel__rim ui-panel__rim--side" aria-hidden />
        {showLabel ? (
          <div className="ui-panel__chrome">
            <span className="ui-panel__label">{variant}</span>
            <span className="ui-panel__indicator" />
          </div>
        ) : null}
        <PanelVisual variant={variant} />
      </div>
    </motion.div>
  );
}
