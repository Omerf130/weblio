"use client";

import { resolveProjectsPageGridBatch1 } from "@/lib/projects/projectsPageGridBatch1";
import type { PublicProjectDto } from "@/types/project";
import ProjectsPageGridCard from "./ProjectsPageGridCard";
import styles from "./ProjectsPageGrid.module.scss";

type ProjectsPageGridProps = {
  projects?: PublicProjectDto[];
};

export default function ProjectsPageGrid({ projects = [] }: ProjectsPageGridProps) {
  const cards = resolveProjectsPageGridBatch1(projects);

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
