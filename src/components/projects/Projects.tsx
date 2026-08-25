"use client";

import { motion } from "framer-motion";
import { FaArrowLeftLong } from "react-icons/fa6";
import type { PublicProjectDto } from "../../types/project";
import Reveal, { staggerItem, staggerParent } from "../motion/Reveal";
import { PROJECT_LINK_REL, projectHref, projectImageSrc } from "../../utils/projectLinks";
import "./Projects.scss";

type ProjectsProps = {
  projects?: PublicProjectDto[];
};

const Projects = ({ projects = [] }: ProjectsProps) => {
  const hasProjects = projects.length > 0;

  return (
    <div className="project-container" id="projects">
      <Reveal as="h1" className="project-heading">
        פרוייקטים
      </Reveal>

      {hasProjects ? (
        <motion.ul
          className="project-ul"
          variants={staggerParent}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {projects.map((project) => (
            <motion.li
              className="project-list-item"
              key={project.id}
              variants={staggerItem}
            >
              <a
                href={projectHref(project.projectUrl)}
                target="_blank"
                rel={PROJECT_LINK_REL}
              >
                <div className="project-content">
                  <div className="project-title">{project.title}</div>
                  {project.subtitle ? (
                    <div className="project-subtitle">{project.subtitle}</div>
                  ) : null}
                  <div className="project-button">
                    <span>{project.ctaLabel}</span>
                    <FaArrowLeftLong className="arrow" />
                  </div>
                </div>
                <img
                  className="project-img"
                  src={projectImageSrc(project.imageUrl)}
                  alt={project.imageAlt}
                />
              </a>
            </motion.li>
          ))}
        </motion.ul>
      ) : (
        <p className="project-empty">פרויקטים חדשים בקרוב</p>
      )}

      <Reveal delay={0.05}>
        <a href="/projects" className="project-btn">
          לפרויקטים נוספים
        </a>
      </Reveal>
    </div>
  );
};

export default Projects;
