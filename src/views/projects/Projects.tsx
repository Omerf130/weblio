"use client";

import { useEffect } from "react";
import { FaArrowLeftLong } from "react-icons/fa6";
import Footer from "../../components/footer/Footer";
import ProjectsNav from "../../components/projectsNav/ProjectsNav";
import type { PublicProjectDto } from "../../types/project";
import { PROJECT_LINK_REL, projectHref, projectImageSrc } from "../../utils/projectLinks";
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

  const hasProjects = projects.length > 0;

  return (
    <div className="project-page-wrapper">
      <ProjectsNav />
      <div className="project-page-container">
        <div className="project-page-content-wrapper">
          <h1 className="project-page-title">פרוייקטים</h1>

          {hasProjects ? (
            <ul className="project-page-ul">
              {projects.map((project) => (
                <li className="project-page-list-item" key={project.id}>
                  <a
                    href={projectHref(project.projectUrl)}
                    target="_blank"
                    rel={PROJECT_LINK_REL}
                  >
                    <div className="project-page-card-content">
                      <div className="project-page-card-title">{project.title}</div>
                      {project.subtitle ? (
                        <div className="project-page-card-subtitle">{project.subtitle}</div>
                      ) : null}

                      <div className="project-page-button">
                        <span>{project.ctaLabel}</span>
                        <FaArrowLeftLong className="project-page-arrow" />
                      </div>
                    </div>

                    <img
                      className="project-page-img"
                      src={projectImageSrc(project.imageUrl)}
                      alt={project.imageAlt}
                    />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="project-page-empty">פרוייקטים נוספים בקרוב</p>
          )}

          <h2 className="project-page-bottom-text">פרוייקטים נוספים בקרוב</h2>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Projects;
