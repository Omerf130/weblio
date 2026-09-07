"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MdArrowBack, MdArrowForward } from "react-icons/md";
import type { PublicProjectDto } from "@/types/project";
import Reveal from "../motion/Reveal";
import { projectImageSrc } from "@/utils/projectLinks";
import {
  formatProgressIndex,
  getActiveProject,
  getNextIndex,
  getNextProject,
  getPreviousIndex,
} from "./featuredProjectsUtils";
import ProjectVisualStack from "./ProjectVisualStack";
import type { TransitionDirection } from "./ProjectStackLayer";
import "./FeaturedProjects.scss";

type FeaturedProjectsShowcaseProps = {
  projects?: PublicProjectDto[];
};

const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;
const SCENE_MS = 920;
const TEXT_SWAP_DELAY_MS = 220;

const textVariants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.52, ease: EASE_PREMIUM, delay: 0.08 },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.32, ease: EASE_PREMIUM },
  },
};

export default function FeaturedProjectsShowcase({
  projects = [],
}: FeaturedProjectsShowcaseProps) {
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] =
    useState<TransitionDirection>("forward");
  const count = projects.length;
  const hasProjects = count > 0;
  const canNavigate = count > 1;

  const activeProject = hasProjects ? getActiveProject(projects, displayIndex) : null;
  const nextProject = hasProjects ? getNextProject(projects, displayIndex) : null;

  const navigateTo = useCallback(
    (targetIndex: number, direction: TransitionDirection) => {
      if (!canNavigate || isTransitioning || targetIndex === activeIndex) return;

      setTransitionDirection(direction);
      setIsTransitioning(true);
      setActiveIndex(targetIndex);

      const textDelay = reducedMotion ? 0 : TEXT_SWAP_DELAY_MS;
      window.setTimeout(() => {
        setDisplayIndex(targetIndex);
      }, textDelay);

      window.setTimeout(() => {
        setIsTransitioning(false);
      }, reducedMotion ? 220 : SCENE_MS);
    },
    [activeIndex, canNavigate, isTransitioning, reducedMotion]
  );

  const goToNext = useCallback(() => {
    navigateTo(getNextIndex(activeIndex, count), "forward");
  }, [activeIndex, count, navigateTo]);

  const goToPrevious = useCallback(() => {
    navigateTo(getPreviousIndex(activeIndex, count), "backward");
  }, [activeIndex, count, navigateTo]);

  useEffect(() => {
    if (activeIndex >= count && count > 0) {
      setActiveIndex(0);
      setDisplayIndex(0);
    }
  }, [activeIndex, count]);

  useEffect(() => {
    if (!nextProject) return;
    const preload = new window.Image();
    preload.src = projectImageSrc(nextProject.imageUrl);
  }, [nextProject]);

  useEffect(() => {
    if (!canNavigate) return;
    const previousProject = projects[getPreviousIndex(displayIndex, count)];
    const preload = new window.Image();
    preload.src = projectImageSrc(previousProject.imageUrl);
  }, [canNavigate, count, displayIndex, projects]);

  return (
    <section className="featured-projects" id="projects" aria-labelledby="featured-projects-heading">
      <div className="featured-projects__atmosphere" aria-hidden>
        <span className="featured-projects__bg-word">PROJECTS</span>
        <span className="featured-projects__stars" />
        <span className="featured-projects__floor-grid" />
        <span className="featured-projects__line featured-projects__line--a" />
        <span className="featured-projects__line featured-projects__line--b" />
        <span className="featured-projects__line featured-projects__line--c" />
        <span className="featured-projects__line featured-projects__line--d" />

        <span className="featured-projects__micro featured-projects__micro--tl">
          <span>CRAFTED</span>
          <span>FOR</span>
          <span>IMPACT</span>
        </span>
        <span className="featured-projects__micro featured-projects__micro--tr">
          <span>IDEAS</span>
          <span>DESIGN</span>
          <span>DEVELOP</span>
          <span>GROW</span>
        </span>
        <span className="featured-projects__micro featured-projects__micro--bl">
          <span>REAL PROJECTS.</span>
          <span>REAL BUSINESSES.</span>
        </span>
        <span className="featured-projects__micro featured-projects__micro--br">
          <span>BUILDING</span>
          <span>A BETTER</span>
          <span>DIGITAL TOMORROW</span>
        </span>

        <div className="featured-projects__handwritten-layer" aria-hidden>
          <figure className="featured-projects__note featured-projects__note--websites">
            <span className="featured-projects__note-text">
              Websites
              <br />
              That Work
            </span>
            <svg
              className="featured-projects__note-stroke featured-projects__note-stroke--arrow"
              viewBox="0 0 88 52"
              aria-hidden
            >
              <path
                d="M82 12 C54 48 28 42 8 28"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <path
                d="M8 28 L16 24 M8 28 L12 36"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </figure>

          <figure className="featured-projects__note featured-projects__note--purpose">
            <span className="featured-projects__note-text">
              Built With
              <br />
              Purpose
            </span>
            <svg
              className="featured-projects__note-stroke featured-projects__note-stroke--swoosh"
              viewBox="0 0 56 12"
              aria-hidden
            >
              <path
                d="M2 8 C18 2 38 2 54 7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          </figure>

          <figure className="featured-projects__note featured-projects__note--ideas">
            <span className="featured-projects__note-text">
              Ideas Into
              <br />
              Reality
            </span>
            <svg
              className="featured-projects__note-stroke featured-projects__note-stroke--underline"
              viewBox="0 0 64 10"
              aria-hidden
            >
              <path
                d="M3 6 C20 2 44 2 61 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </figure>
        </div>
      </div>

      <div className="featured-projects__inner">
        <header className="featured-projects__header">
          <Reveal as="p" className="featured-projects__header-eyebrow">
            OUR WORK
          </Reveal>
          <Reveal as="h2" className="featured-projects__heading" id="featured-projects-heading">
            פרוייקטים
          </Reveal>
          <Reveal as="p" className="featured-projects__header-sub" delay={0.04}>
            אתרים שמייצרים תוצאות אמיתיות לעסקים אמיתיים
          </Reveal>
        </header>

        {!hasProjects ? (
          <p className="featured-projects__empty">פרויקטים חדשים בקרוב</p>
        ) : (
          <>
            <div className="featured-projects__scene">
              <span
                className="featured-projects__env-index"
                aria-hidden
                key={`env-${displayIndex}`}
              >
                {formatProgressIndex(displayIndex + 1)}
              </span>

              <div className="featured-projects__info">
                <div className="featured-projects__progress-row">
                  <span className="featured-projects__progress-line featured-projects__progress-line--lead" aria-hidden />
                  <span className="featured-projects__progress" dir="ltr" aria-live="polite">
                    <span className="featured-projects__progress-current">
                      {formatProgressIndex(displayIndex + 1)}
                    </span>
                    <span className="featured-projects__progress-sep" aria-hidden>
                      {" / "}
                    </span>
                    <span className="featured-projects__progress-total">
                      {formatProgressIndex(count)}
                    </span>
                  </span>
                  <span className="featured-projects__progress-line" aria-hidden />
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeProject?.id}
                    className="featured-projects__copy"
                    variants={textVariants}
                    initial={reducedMotion ? false : "initial"}
                    animate="animate"
                    exit={reducedMotion ? undefined : "exit"}
                  >
                    <h3 className="featured-projects__title">{activeProject?.title}</h3>
                    {activeProject?.subtitle ? (
                      <p className="featured-projects__subtitle">{activeProject.subtitle}</p>
                    ) : null}

                    {activeProject?.description ? (
                      <p className="featured-projects__description">{activeProject.description}</p>
                    ) : null}

                    {activeProject?.technologies && activeProject.technologies.length > 0 ? (
                      <ul className="featured-projects__tags" aria-label="טכנולוגיות">
                        {activeProject.technologies.map((tech) => (
                          <li key={tech} className="featured-projects__tag">
                            {tech}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </motion.div>
                </AnimatePresence>

                {canNavigate && nextProject ? (
                  <div className="featured-projects__nav">
                    <span className="featured-projects__info-line" aria-hidden />
                    <div className="featured-projects__carousel" role="group" aria-label="ניווט בין פרויקטים">
                      <button
                        type="button"
                        className="featured-projects__carousel-arrow featured-projects__carousel-arrow--prev"
                        onClick={goToPrevious}
                        disabled={isTransitioning}
                        aria-label="הפרויקט הקודם"
                      >
                        <MdArrowBack aria-hidden />
                      </button>
                      <div className="featured-projects__carousel-center">
                        <span className="featured-projects__next-label">לפרויקט הבא</span>
                        <span className="featured-projects__next-title">{nextProject.title}</span>
                      </div>
                      <button
                        type="button"
                        className="featured-projects__carousel-arrow featured-projects__carousel-arrow--next"
                        onClick={goToNext}
                        disabled={isTransitioning}
                        aria-label={`הפרויקט הבא: ${nextProject.title}`}
                      >
                        <MdArrowForward aria-hidden />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="featured-projects__visual featured-projects__visual--desktop">
                <ProjectVisualStack
                  projects={projects}
                  activeIndex={activeIndex}
                  isTransitioning={isTransitioning}
                  reducedMotion={!!reducedMotion}
                  transitionDirection={transitionDirection}
                />
              </div>
            </div>

            <div className="featured-projects__mobile">
              <header className="featured-projects__header featured-projects__header--mobile">
                <span className="featured-projects__header-eyebrow featured-projects__header-eyebrow--mobile">
                  OUR WORK
                </span>
                <h2 className="featured-projects__heading featured-projects__heading--mobile">
                  פרוייקטים
                </h2>
                <p className="featured-projects__header-sub featured-projects__header-sub--mobile">
                  אתרים שמייצרים תוצאות אמיתיות לעסקים אמיתיים
                </p>
              </header>

              <div className="featured-projects__visual featured-projects__visual--mobile">
                <ProjectVisualStack
                  projects={projects}
                  activeIndex={activeIndex}
                  isTransitioning={isTransitioning}
                  reducedMotion={!!reducedMotion}
                  transitionDirection={transitionDirection}
                  mobile
                />
              </div>

              <div className="featured-projects__progress-row featured-projects__progress-row--mobile">
                <span
                  className="featured-projects__progress-line featured-projects__progress-line--lead"
                  aria-hidden
                />
                <span className="featured-projects__progress" dir="ltr" aria-live="polite">
                  <span className="featured-projects__progress-current">
                    {formatProgressIndex(displayIndex + 1)}
                  </span>
                  <span className="featured-projects__progress-sep" aria-hidden>
                    {" / "}
                  </span>
                  <span className="featured-projects__progress-total">
                    {formatProgressIndex(count)}
                  </span>
                </span>
                <span className="featured-projects__progress-line" aria-hidden />
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`mobile-${activeProject?.id}`}
                  className="featured-projects__mobile-copy"
                  variants={textVariants}
                  initial={reducedMotion ? false : "initial"}
                  animate="animate"
                  exit={reducedMotion ? undefined : "exit"}
                >
                  <h3 className="featured-projects__title">{activeProject?.title}</h3>
                  {activeProject?.subtitle ? (
                    <p className="featured-projects__subtitle">{activeProject.subtitle}</p>
                  ) : null}

                  {activeProject?.description ? (
                    <p className="featured-projects__description">{activeProject.description}</p>
                  ) : null}

                  {activeProject?.technologies && activeProject.technologies.length > 0 ? (
                    <ul className="featured-projects__tags" aria-label="טכנולוגיות">
                      {activeProject.technologies.map((tech) => (
                        <li key={tech} className="featured-projects__tag">
                          {tech}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </motion.div>
              </AnimatePresence>

              {canNavigate && nextProject ? (
                <div className="featured-projects__nav featured-projects__nav--mobile">
                  <div
                    className="featured-projects__carousel featured-projects__carousel--mobile"
                    role="group"
                    aria-label="ניווט בין פרויקטים"
                  >
                    <button
                      type="button"
                      className="featured-projects__carousel-arrow featured-projects__carousel-arrow--prev"
                      onClick={goToPrevious}
                      disabled={isTransitioning}
                      aria-label="הפרויקט הקודם"
                    >
                      <MdArrowBack aria-hidden />
                    </button>
                    <div className="featured-projects__carousel-center">
                      <span className="featured-projects__next-label">לפרויקט הבא</span>
                      <span className="featured-projects__next-title">{nextProject.title}</span>
                    </div>
                    <button
                      type="button"
                      className="featured-projects__carousel-arrow featured-projects__carousel-arrow--next"
                      onClick={goToNext}
                      disabled={isTransitioning}
                      aria-label={`הפרויקט הבא: ${nextProject.title}`}
                    >
                      <MdArrowForward aria-hidden />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>

      {hasProjects ? (
        <Reveal delay={0.05} className="featured-projects__cta-row-wrap">
          <div className="featured-projects__cta-row">
            <span className="featured-projects__cta-line" aria-hidden />
            <a href="/projects" className="featured-projects__all-cta">
              <span>לכל הפרויקטים</span>
              <span className="featured-projects__all-cta-icon" aria-hidden>
                <MdArrowBack />
              </span>
            </a>
            <span className="featured-projects__cta-line" aria-hidden />
          </div>
        </Reveal>
      ) : null}
    </section>
  );
}
