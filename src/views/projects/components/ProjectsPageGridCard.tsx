"use client";

import Image from "next/image";
import { FaArrowLeftLong } from "react-icons/fa6";
import type { ProjectsPageGridCardModel } from "@/lib/projects/projects-page-grid";
import { PROJECT_LINK_REL, projectHref } from "@/utils/projectLinks";
import styles from "./ProjectsPageGrid.module.scss";

type ProjectsPageGridCardProps = {
  card: ProjectsPageGridCardModel;
};

export default function ProjectsPageGridCard({ card }: ProjectsPageGridCardProps) {
  const headingId = `projects-grid-${card.slotId}-title`;
  const hasDescription = Boolean(card.description);
  const bodyText =
    card.description ?? (card.project.subtitle?.trim() ? card.project.subtitle.trim() : null);
  const showSubtitle = Boolean(card.project.subtitle?.trim()) && hasDescription;

  return (
    <li className={styles.item}>
      <article
        className={styles.card}
        data-slot={card.slotId}
        aria-labelledby={headingId}
      >
        <div className={styles.background} aria-hidden>
          <div className={styles.backgroundMedia}>
            <Image
              src={card.showcaseImageSrc}
              alt=""
              fill
              className={styles.backgroundImage}
              style={{ objectPosition: card.objectPosition }}
              sizes="(max-width: 768px) 100vw, (max-width: 1100px) 50vw, 33vw"
              quality={90}
            />
          </div>
          <div className={styles.backgroundTreatment} />
        </div>

        <div className={styles.content}>
          <div className={styles.contentInner}>
            <h3 id={headingId} className={styles.title}>
              {card.displayTitle}
            </h3>

            {showSubtitle ? (
              <p className={styles.subtitle}>{card.project.subtitle}</p>
            ) : null}

            {bodyText ? <p className={styles.bodyText}>{bodyText}</p> : null}

            {card.tags.length > 0 ? (
              <ul className={styles.tags} aria-label="טכנולוגיות">
                {card.tags.map((tag) => (
                  <li key={tag} className={styles.tag}>
                    {tag}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <a
            className={styles.cta}
            href={projectHref(card.project.projectUrl)}
            target="_blank"
            rel={PROJECT_LINK_REL}
          >
            <span>{card.ctaLabel}</span>
            <FaArrowLeftLong className={styles.ctaIcon} aria-hidden />
          </a>
        </div>

        <span className={styles.srOnly}>{card.showcaseImageAlt}</span>
      </article>
    </li>
  );
}
