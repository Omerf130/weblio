"use client";

import type { PublicProjectDto } from "../../types/project";
import FeaturedProjectsShowcase from "./FeaturedProjectsShowcase";

type ProjectsProps = {
  projects?: PublicProjectDto[];
};

const Projects = ({ projects = [] }: ProjectsProps) => {
  return <FeaturedProjectsShowcase projects={projects} />;
};

export default Projects;
