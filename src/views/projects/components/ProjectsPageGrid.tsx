"use client";

import { resolveProjectsPageGridCards } from "@/lib/projects/projects-page-grid";
import type { ProjectsPagePublicProjectDto } from "@/types/project";
import ProjectsPageGridCard from "./ProjectsPageGridCard";
import styles from "./ProjectsPageGrid.module.scss";

type ProjectsPageGridProps = {
  projects?: ProjectsPagePublicProjectDto[];
};

export default function ProjectsPageGrid({ projects = [] }: ProjectsPageGridProps) {
  const cards = resolveProjectsPageGridCards(projects);

  if (cards.length === 0) {
    return null;
  }

  return (
    <ul className={styles.grid} aria-label="פרויקטים">
      {cards.map((card) => (
        <ProjectsPageGridCard key={card.project.id} card={card} />
      ))}
    </ul>
  );
}
