"use client";

import Image from "next/image";
import styles from "./ProjectsPageHero.module.scss";

const PROJECTS_HERO_IMAGE_PATH = "/pics/projects-hero.png";
const PROJECTS_HERO_IMAGE_ALT =
  "תצוגת תיק עבודות Weblio: מחשב נייד וטלפון המציגים אתר אמיתי על רקע הרים מואר";

/** Intrinsic dimensions of public/pics/projects-hero.png — update if the asset file changes. */
const PROJECTS_HERO_IMAGE_WIDTH = 2204;
const PROJECTS_HERO_IMAGE_HEIGHT = 713;

const HERO_METRICS = [
  { value: "15+", label: "פרויקטים שבוצעו" },
  { value: "10+", label: "לקוחות מרוצים" },
  { value: "100%", label: "אתרים רספונסיביים" },
] as const;

export default function ProjectsPageHero() {
  return (
    <section className={styles.hero} aria-labelledby="projects-hero-heading">
      <div className={styles.atmosphere} aria-hidden>
        <div className={styles.glowCyan} />
        <div className={styles.glowViolet} />
      </div>

      <div className={styles.inner}>
        <div className={styles.content}>
          <p className={styles.eyebrow}>PORTFOLIO</p>

          <h1 id="projects-hero-heading" className={styles.headline}>
            <span className={styles.headlinePrimary}>פרויקטים </span>
            <span className={styles.headlineGradient}>שבניתי</span>
          </h1>

          <p className={styles.description}>
            כל עסק מתחיל ממקום אחר. המטרה שלי היא להפוך את הרעיון לאתר שנראה טוב, עובד
            נכון ומרגיש בדיוק כמו העסק שמאחוריו.
          </p>

          <dl className={styles.metrics}>
            {HERO_METRICS.map((metric) => (
              <div className={styles.metric} key={metric.value}>
                <dt className={styles.metricValue} dir="ltr">
                  {metric.value}
                </dt>
                <dd className={styles.metricLabel}>{metric.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className={styles.showcaseScene}>
          <div className={styles.showcaseAmbient} aria-hidden />
          <div className={styles.showcaseBlend}>
            <Image
              src={PROJECTS_HERO_IMAGE_PATH}
              alt={PROJECTS_HERO_IMAGE_ALT}
              width={PROJECTS_HERO_IMAGE_WIDTH}
              height={PROJECTS_HERO_IMAGE_HEIGHT}
              className={styles.showcaseImage}
              priority
              quality={95}
              sizes="(min-width: 1200px) 92vw, 100vw"
            />
            <div className={styles.showcaseEdgeFade} aria-hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
