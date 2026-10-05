"use client";

import Image from "next/image";
import { FaArrowLeftLong, FaStar } from "react-icons/fa6";
import {
  PROJECTS_PAGE_FEATURED_CTA_LABEL,
  resolveProjectsPageFeaturedCards,
  type ProjectsPageFeaturedCardModel,
} from "@/lib/projects/projectsPageFeatured";
import type { PublicProjectDto } from "@/types/project";
import { PROJECT_LINK_REL, projectHref } from "@/utils/projectLinks";
import styles from "./ProjectsPageFeatured.module.scss";

type ProjectsPageFeaturedProps = {
  projects?: PublicProjectDto[];
};

function FeaturedProjectCard({ card }: { card: ProjectsPageFeaturedCardModel }) {
  const headingId = `projects-featured-${card.slot}-title`;

  return (
    <article
      className={styles.card}
      data-slot={card.slot}
      aria-labelledby={headingId}
    >
      <div className={styles.background} aria-hidden>
        <div className={styles.backgroundMedia}>
          <Image
            src={card.featuredImageSrc}
            alt=""
            fill
            className={styles.backgroundImage}
            style={{ objectPosition: card.objectPosition }}
            sizes="(max-width: 992px) 100vw, 50vw"
            quality={92}
          />
        </div>
        <div className={styles.backgroundTreatment} />
        <div className={styles.backgroundAmbient} />
      </div>

      {card.showFeaturedBadge ? (
        <span className={styles.badge}>
          <FaStar className={styles.badgeIcon} aria-hidden />
          <span>פרויקט נבחר</span>
        </span>
      ) : null}

      <div className={styles.content}>
        <div className={styles.contentInner}>
          <h3 id={headingId} className={styles.title}>
            {card.displayTitle}
          </h3>

          {card.project.subtitle ? (
            <p className={styles.subtitle}>{card.project.subtitle}</p>
          ) : null}

          {card.description ? (
            <p className={styles.description}>{card.description}</p>
          ) : null}

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
          <span>{PROJECTS_PAGE_FEATURED_CTA_LABEL}</span>
          <FaArrowLeftLong className={styles.ctaIcon} aria-hidden />
        </a>
      </div>

      <span className={styles.srOnly}>{card.featuredImageAlt}</span>
    </article>
  );
}

export default function ProjectsPageFeatured({ projects = [] }: ProjectsPageFeaturedProps) {
  const cards = resolveProjectsPageFeaturedCards(projects);

  if (cards.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-labelledby="projects-featured-heading">
      <h2 id="projects-featured-heading" className={styles.srOnly}>
        פרויקטים נבחרים
      </h2>

      <div className={styles.row}>
        {cards.map((card) => (
          <FeaturedProjectCard key={card.project.id} card={card} />
        ))}
      </div>
    </section>
  );
}
