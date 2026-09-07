import type { CSSProperties } from "react";
import "./WhyWeblio.scss";

const PARTICLE_TINY = [
  { top: "12%", left: "22%", delay: 0 },
  { top: "20%", left: "48%", delay: 1.4 },
  { top: "28%", left: "58%", delay: 0.8 },
  { top: "36%", left: "32%", delay: 2.2 },
  { top: "44%", left: "68%", delay: 1.1 },
  { top: "52%", left: "18%", delay: 2.8 },
  { top: "58%", left: "42%", delay: 0.5 },
  { top: "64%", left: "54%", delay: 3.1 },
  { top: "72%", left: "28%", delay: 1.7 },
  { top: "78%", left: "62%", delay: 2.4 },
] as const;

const PARTICLE_BRIDGE = [
  { top: "22%", left: "-10%", size: 1, blur: 1, opacity: 0.28, delay: 0.4 },
  { top: "32%", left: "-16%", size: 1.5, blur: 1.2, opacity: 0.24, delay: 1.6 },
  { top: "42%", left: "-8%", size: 1, blur: 0.8, opacity: 0.32, delay: 2.3 },
  { top: "50%", left: "-14%", size: 1.6, blur: 1.4, opacity: 0.22, delay: 0.9 },
  { top: "58%", left: "-6%", size: 1, blur: 0.6, opacity: 0.34, delay: 2.7 },
  { top: "36%", left: "-20%", size: 2, blur: 2, opacity: 0.16, delay: 4.0 },
] as const;

const PARTICLE_MED = [
  { top: "14%", left: "38%", size: 2.5, delay: 0.6 },
  { top: "32%", left: "52%", size: 3, delay: 1.9 },
  { top: "46%", left: "24%", size: 2.5, delay: 2.5 },
  { top: "54%", left: "46%", size: 2.5, delay: 3.4 },
  { top: "68%", left: "36%", size: 2, delay: 1.8 },
] as const;

const PARTICLE_BRIGHT = [
  { top: "16%", left: "44%", size: 3.5, delay: 0 },
  { top: "58%", left: "32%", size: 3, delay: 2.1 },
] as const;

// Behind laptop — full upper arc + entry from lower-left
const ORBIT_BACK = "M 12 448 C 95 368, 240 118, 395 82";
const ORBIT_BACK_INNER = "M 48 420 C 130 340, 268 148, 408 118";
const ORBIT_BACK_UPPER = "M 395 82 S 545 148, 648 248";
const ORBIT_HALO_BACK = "M 12 448 C 95 368, 240 118, 395 82";
const ORBIT_HALO_BACK_UPPER = "M 395 82 S 545 148, 648 248";

// In front of laptop — lower rock wrap + side emergence only
const ORBIT_ROCK_FRONT = "M 268 368 C 338 352, 418 346, 498 362 S 598 398, 642 428";
const ORBIT_SIDE_FRONT = "M 648 248 C 612 278, 568 318, 512 338 S 420 358, 368 372";
const ORBIT_HALO_ROCK = "M 268 368 C 338 352, 418 346, 498 362 S 598 398, 642 428";

type SceneDecorProps = {
  layer: "back" | "front";
};

export default function SceneDecor({ layer }: SceneDecorProps) {
  if (layer === "back") {
    return (
      <>
        <div className="why-weblio__particles-layer why-weblio__particles-layer--back" aria-hidden>
          {PARTICLE_TINY.map((particle, index) => (
            <span
              key={`tiny-${particle.top}-${particle.left}`}
              className="why-weblio__particle why-weblio__particle--tiny"
              style={
                {
                  top: particle.top,
                  left: particle.left,
                  animationDelay: `${particle.delay}s`,
                  ["--particle-index" as string]: index,
                } as CSSProperties
              }
            />
          ))}
          {PARTICLE_BRIDGE.map((particle, index) => (
            <span
              key={`bridge-${particle.top}-${particle.left}`}
              className="why-weblio__particle why-weblio__particle--bridge"
              style={
                {
                  top: particle.top,
                  left: particle.left,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  opacity: particle.opacity,
                  filter: `blur(${particle.blur}px)`,
                  animationDelay: `${particle.delay}s`,
                  ["--particle-index" as string]: index + 10,
                } as CSSProperties
              }
            />
          ))}
        </div>

        <div className="why-weblio__orbit-layer why-weblio__orbit-layer--back" aria-hidden>
          <svg
            className="why-weblio__orbit why-weblio__orbit--back"
            viewBox="0 0 720 480"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="why-weblio-orbit-grad-back" x1="0%" y1="100%" x2="100%" y2="12%">
                <stop offset="0%" stopColor="rgba(96, 139, 193, 0)" />
                <stop offset="22%" stopColor="rgba(96, 139, 193, 0)" />
                <stop offset="42%" stopColor="rgba(96, 139, 193, 0.2)" />
                <stop offset="62%" stopColor="rgba(140, 195, 255, 0.46)" />
                <stop offset="100%" stopColor="rgba(96, 139, 193, 0.06)" />
              </linearGradient>
              <linearGradient id="why-weblio-orbit-grad-back-upper" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(96, 139, 193, 0)" />
                <stop offset="30%" stopColor="rgba(140, 195, 255, 0.38)" />
                <stop offset="68%" stopColor="rgba(160, 210, 255, 0.52)" />
                <stop offset="100%" stopColor="rgba(96, 139, 193, 0)" />
              </linearGradient>
              <filter id="why-weblio-orbit-halo-back" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="8" />
              </filter>
              <filter id="why-weblio-orbit-glow-back">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path
              className="why-weblio__orbit-path why-weblio__orbit-path--halo why-weblio__orbit-path--halo-back"
              d={ORBIT_HALO_BACK}
              fill="none"
              stroke="rgba(120, 180, 255, 0.1)"
              strokeWidth="10"
              filter="url(#why-weblio-orbit-halo-back)"
            />
            <path
              className="why-weblio__orbit-path why-weblio__orbit-path--core why-weblio__orbit-path--core-back"
              d={ORBIT_BACK}
              fill="none"
              stroke="url(#why-weblio-orbit-grad-back)"
              strokeWidth="1.5"
              opacity="0.34"
              filter="url(#why-weblio-orbit-glow-back)"
            />
            <path
              className="why-weblio__orbit-path why-weblio__orbit-path--inner-back"
              d={ORBIT_BACK_INNER}
              fill="none"
              stroke="rgba(96, 139, 193, 0.09)"
              strokeWidth="1"
              opacity="0.4"
            />
            <path
              className="why-weblio__orbit-path why-weblio__orbit-path--halo why-weblio__orbit-path--halo-back-upper"
              d={ORBIT_HALO_BACK_UPPER}
              fill="none"
              stroke="rgba(120, 180, 255, 0.08)"
              strokeWidth="7"
              filter="url(#why-weblio-orbit-halo-back)"
            />
            <path
              className="why-weblio__orbit-path why-weblio__orbit-path--core-back-upper"
              d={ORBIT_BACK_UPPER}
              fill="none"
              stroke="url(#why-weblio-orbit-grad-back-upper)"
              strokeWidth="1.75"
              opacity="0.32"
              filter="url(#why-weblio-orbit-glow-back)"
            />
          </svg>
        </div>
      </>
    );
  }

  return (
    <div className="why-weblio__orbit-layer why-weblio__orbit-layer--front" aria-hidden>
      <svg
        className="why-weblio__orbit why-weblio__orbit--front"
        viewBox="0 0 720 480"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="why-weblio-orbit-rock-grad" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="rgba(96, 139, 193, 0)" />
            <stop offset="30%" stopColor="rgba(140, 195, 255, 0.42)" />
            <stop offset="70%" stopColor="rgba(160, 210, 255, 0.68)" />
            <stop offset="100%" stopColor="rgba(96, 139, 193, 0)" />
          </linearGradient>
          <linearGradient id="why-weblio-orbit-side-grad" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(140, 195, 255, 0.55)" />
            <stop offset="100%" stopColor="rgba(96, 139, 193, 0)" />
          </linearGradient>
          <filter id="why-weblio-orbit-halo-rock" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
          <filter id="why-weblio-orbit-glow-front">
            <feGaussianBlur stdDeviation="1.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          className="why-weblio__orbit-path why-weblio__orbit-path--halo why-weblio__orbit-path--halo-rock"
          d={ORBIT_HALO_ROCK}
          fill="none"
          stroke="rgba(140, 195, 255, 0.16)"
          strokeWidth="5"
          filter="url(#why-weblio-orbit-halo-rock)"
        />
        <path
          className="why-weblio__orbit-path why-weblio__orbit-path--rock-front"
          d={ORBIT_ROCK_FRONT}
          fill="none"
          stroke="url(#why-weblio-orbit-rock-grad)"
          strokeWidth="2.15"
          filter="url(#why-weblio-orbit-glow-front)"
        />
        <path
          className="why-weblio__orbit-path why-weblio__orbit-path--side-front"
          d={ORBIT_SIDE_FRONT}
          fill="none"
          stroke="url(#why-weblio-orbit-side-grad)"
          strokeWidth="1.65"
          opacity="0.62"
          filter="url(#why-weblio-orbit-glow-front)"
        />
      </svg>

      <div className="why-weblio__particles why-weblio__particles--front" aria-hidden>
        {PARTICLE_MED.map((particle, index) => (
          <span
            key={`med-${particle.top}-${particle.left}`}
            className="why-weblio__particle why-weblio__particle--med"
            style={
              {
                top: particle.top,
                left: particle.left,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                animationDelay: `${particle.delay}s`,
                ["--particle-index" as string]: index + 12,
              } as CSSProperties
            }
          />
        ))}
        {PARTICLE_BRIGHT.map((particle, index) => (
          <span
            key={`bright-${particle.top}-${particle.left}`}
            className="why-weblio__particle why-weblio__particle--bright"
            style={
              {
                top: particle.top,
                left: particle.left,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                animationDelay: `${particle.delay}s`,
                ["--particle-index" as string]: index + 20,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}
