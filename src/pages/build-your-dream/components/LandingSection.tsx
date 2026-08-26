import type { ReactNode } from "react";
import styles from "./LandingSection.module.scss";

type LandingSectionVariant =
  | "default"
  | "warm"
  | "accent"
  | "banner"
  | "cream"
  | "champagne"
  | "glow";

type LandingSectionProps = {
  id?: string;
  children: ReactNode;
  variant?: LandingSectionVariant;
  density?: "tight" | "default" | "loose";
  ariaLabelledBy?: string;
};

export default function LandingSection({
  id,
  children,
  variant = "default",
  density = "default",
  ariaLabelledBy,
}: LandingSectionProps) {
  return (
    <section
      id={id}
      className={`${styles.section} ${styles[variant]} ${styles[`density_${density}`]}`}
      aria-labelledby={ariaLabelledBy}
    >
      <div className={styles.inner}>{children}</div>
    </section>
  );
}
