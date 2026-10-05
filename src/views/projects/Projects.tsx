"use client";

import { useEffect } from "react";
import Footer from "../../components/footer/Footer";
import ProjectsNav from "../../components/projectsNav/ProjectsNav";
import ProjectsPageFeatured from "./components/ProjectsPageFeatured";
import ProjectsPageGrid from "./components/ProjectsPageGrid";
import ProjectsPageHero from "./components/ProjectsPageHero";
import type { PublicProjectDto } from "../../types/project";
import "./Projects.scss";

type ProjectsPageProps = {
  projects?: PublicProjectDto[];
};

const Projects = ({ projects = [] }: ProjectsPageProps) => {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  return (
    <div className="project-page-wrapper">
      <ProjectsNav />
      <ProjectsPageHero />
      <ProjectsPageFeatured projects={projects} />
      <div className="project-page-container">
        <div className="project-page-content-wrapper" id="projects-grid">
          {projects.length > 0 ? (
            <ProjectsPageGrid projects={projects} />
          ) : (
            <p className="project-page-empty">פרוייקטים נוספים בקרוב</p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Projects;
