import type { ReactNode } from "react";
import styles from "./LandingImageFrame.module.scss";

type LandingImageFrameProps = {
  children: ReactNode;
  variant?: "default" | "hero" | "editorial" | "tilted";
};

export default function LandingImageFrame({
  children,
  variant = "default",
}: LandingImageFrameProps) {
  const variantClass =
    variant === "tilted" ? `${styles.tilted} ${styles.editorial}` : styles[variant];

  return <div className={`${styles.frame} ${variantClass}`}>{children}</div>;
}
