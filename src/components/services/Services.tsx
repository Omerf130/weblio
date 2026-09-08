"use client";

import { useCallback, useEffect, useState, type FocusEvent } from "react";
import { BsCartCheckFill } from "react-icons/bs";
import { MdArrowBack, MdMonitor, MdRocketLaunch } from "react-icons/md";
import type { IconType } from "react-icons";
import { CONSTS } from "../../consts";
import Reveal from "../motion/Reveal";
import "./Services.scss";

const ICONS: Record<
  (typeof CONSTS.HOMEPAGE_SERVICES.PREVIEW_ITEMS)[number]["id"],
  IconType
> = {
  showcase: MdMonitor,
  landing: MdRocketLaunch,
  ecommerce: BsCartCheckFill,
};

const DEFAULT_ACTIVE_INDEX = 0;

const headingId = "home-services-heading";
const subtitleId = "home-services-subtitle";

const Services = () => {
  const { EYEBROW, TITLE, SUBTITLE, CLOSING_TEXT, CTA_VIEW_ALL, PREVIEW_ITEMS } =
    CONSTS.HOMEPAGE_SERVICES;

  const [activeIndex, setActiveIndex] = useState(DEFAULT_ACTIVE_INDEX);
  const [hoverEnabled, setHoverEnabled] = useState(false);

  useEffect(() => {
    const pointerMq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setHoverEnabled(pointerMq.matches);
    update();
    pointerMq.addEventListener("change", update);
    return () => pointerMq.removeEventListener("change", update);
  }, []);

  const resetActive = useCallback(() => {
    setActiveIndex(DEFAULT_ACTIVE_INDEX);
  }, []);

  const handleRowEnter = useCallback(
    (index: number) => {
      if (hoverEnabled) setActiveIndex(index);
    },
    [hoverEnabled]
  );

  const handleRowsLeave = useCallback(() => {
    if (hoverEnabled) resetActive();
  }, [hoverEnabled, resetActive]);

  const handleActionFocus = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const handleRowsBlur = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      const next = event.relatedTarget;
      if (!next || !event.currentTarget.contains(next as Node)) {
        resetActive();
      }
    },
    [resetActive]
  );

  return (
    <section
      className={`home-services${hoverEnabled ? " home-services--interactive" : ""}`}
      id="services"
      aria-labelledby={headingId}
      aria-describedby={subtitleId}
      dir="rtl"
      data-active-row={activeIndex}
    >
      <div className="home-services__atmosphere" aria-hidden>
        <span className="home-services__glow home-services__glow--center" />
        <span className="home-services__glow home-services__glow--active" />
        <span className="home-services__glow home-services__glow--cta" />
        <span className="home-services__stars" />

        <svg
          className="home-services__arc home-services__arc--a"
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            className="home-services__arc-glow"
            d="M -40 520 C 280 80, 720 40, 1240 480"
            stroke="url(#home-services-arc-a-glow)"
            strokeWidth="2.5"
          />
          <path
            d="M -40 520 C 280 80, 720 40, 1240 480"
            fill="none"
            stroke="url(#home-services-arc-a)"
            strokeWidth="1"
          />
          <defs>
            <linearGradient id="home-services-arc-a-glow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(96, 139, 193, 0)" />
              <stop offset="30%" stopColor="rgba(120, 180, 255, 0.22)" />
              <stop offset="50%" stopColor="rgba(160, 215, 255, 0.42)" />
              <stop offset="70%" stopColor="rgba(120, 180, 255, 0.18)" />
              <stop offset="100%" stopColor="rgba(96, 139, 193, 0)" />
            </linearGradient>
            <linearGradient id="home-services-arc-a" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(96, 139, 193, 0)" />
              <stop offset="22%" stopColor="rgba(120, 180, 255, 0.28)" />
              <stop offset="48%" stopColor="rgba(170, 220, 255, 0.72)" />
              <stop offset="72%" stopColor="rgba(120, 180, 255, 0.24)" />
              <stop offset="100%" stopColor="rgba(96, 139, 193, 0)" />
            </linearGradient>
          </defs>
        </svg>

        <svg
          className="home-services__arc home-services__arc--b"
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            className="home-services__arc-glow"
            d="M 80 580 C 420 120, 860 160, 1180 420"
            stroke="url(#home-services-arc-b-glow)"
            strokeWidth="2.5"
          />
          <path
            d="M 80 580 C 420 120, 860 160, 1180 420"
            fill="none"
            stroke="url(#home-services-arc-b)"
            strokeWidth="1"
          />
          <defs>
            <linearGradient id="home-services-arc-b-glow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(96, 139, 193, 0.08)" />
              <stop offset="42%" stopColor="rgba(120, 180, 255, 0.2)" />
              <stop offset="58%" stopColor="rgba(160, 215, 255, 0.36)" />
              <stop offset="100%" stopColor="rgba(96, 139, 193, 0)" />
            </linearGradient>
            <linearGradient id="home-services-arc-b" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(96, 139, 193, 0.1)" />
              <stop offset="38%" stopColor="rgba(120, 180, 255, 0.38)" />
              <stop offset="62%" stopColor="rgba(170, 220, 255, 0.62)" />
              <stop offset="100%" stopColor="rgba(96, 139, 193, 0)" />
            </linearGradient>
          </defs>
        </svg>

        <svg
          className="home-services__arc home-services__arc--c"
          viewBox="0 0 800 400"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            className="home-services__arc-glow"
            d="M -20 360 Q 400 40 820 300"
            stroke="rgba(140, 195, 255, 0.22)"
            strokeWidth="2"
          />
          <path
            d="M -20 360 Q 400 40 820 300"
            fill="none"
            stroke="rgba(160, 215, 255, 0.32)"
            strokeWidth="1"
          />
        </svg>

        <span className="home-services__micro home-services__micro--tl">
          <span>DESIGN</span>
          <span>DEVELOP</span>
          <span>LAUNCH</span>
          <span>GROW</span>
        </span>

        <span className="home-services__micro home-services__micro--br">
          <span>DIGITAL EXPERIENCES</span>
          <span>THAT MOVE BUSINESSES</span>
        </span>

        <figure className="home-services__note">
          <span className="home-services__note-text">Built Different</span>
        </figure>

        <span className="home-services__micro home-services__micro--bl">
          <span>WEBSITES</span>
          <span>LANDING PAGES</span>
          <span>E-COMMERCE</span>
          <span>& MORE</span>
        </span>
      </div>

      <div className="home-services__inner">
        <Reveal as="header" className="home-services__header">
          <p className="home-services__eyebrow">{EYEBROW}</p>
          <h2 className="home-services__title" id={headingId}>
            {TITLE.replace(" ביחד?", "")}{" "}
            <span className="home-services__title-accent">ביחד?</span>
          </h2>
          <p id={subtitleId} className="home-services__subtitle">
            {SUBTITLE}
          </p>
        </Reveal>

        <div
          className="home-services__rows"
          role="list"
          onMouseLeave={handleRowsLeave}
          onBlur={handleRowsBlur}
        >
          {PREVIEW_ITEMS.map((item, index) => {
            const Icon = ICONS[item.id];
            const isActive = activeIndex === index;

            return (
              <Reveal key={item.id} delay={index * 0.04} className="home-services__row-wrap">
                {index > 0 ? (
                  <hr
                    className={`home-services__divider${
                      activeIndex === index - 1 ? " home-services__divider--after-active" : ""
                    }`}
                    aria-hidden
                  />
                ) : null}

                <article
                  className={`home-services__row${isActive ? " home-services__row--active" : ""}`}
                  role="listitem"
                  aria-current={isActive ? "true" : undefined}
                  onMouseEnter={() => handleRowEnter(index)}
                >
                  <span className="home-services__row-light" aria-hidden />

                  <span className="home-services__bg-word" aria-hidden>
                    {item.bgWord}
                  </span>

                  <div className="home-services__row-inner" dir="ltr">
                    <span className="home-services__number" aria-hidden>
                      {item.number}
                    </span>

                    <span className="home-services__v-sep" aria-hidden />

                    <div className="home-services__icon-col">
                      <span className="home-services__icon-ring" aria-hidden>
                        <Icon size={22} />
                      </span>
                    </div>

                    <span className="home-services__v-sep" aria-hidden />

                    <div className="home-services__content" dir="rtl">
                      <h3 className="home-services__service-title">{item.title}</h3>
                      <p className="home-services__description">
                        {item.description.map((line) => (
                          <span key={line} className="home-services__description-line">
                            {line}
                          </span>
                        ))}
                      </p>
                      <ul className="home-services__tags" aria-label="יכולות">
                        {item.tags.map((tag) => (
                          <li key={tag} className="home-services__tag">
                            {tag}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <span className="home-services__v-sep" aria-hidden />

                    <a
                      className="home-services__action"
                      href="/services"
                      aria-label={`לפרטים על ${item.title}`}
                      onFocus={() => handleActionFocus(index)}
                    >
                      <span className="home-services__action-btn" aria-hidden>
                        <MdArrowBack />
                      </span>
                      <span className="home-services__action-label">לפרטים</span>
                    </a>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="home-services__closing" delay={0.12}>
          <p className="home-services__closing-text">{CLOSING_TEXT}</p>
          <div className="home-services__cta-row">
            <span className="home-services__cta-line" aria-hidden />
            <a href="/services" className="home-services__cta">
              <span>{CTA_VIEW_ALL}</span>
              <span className="home-services__cta-icon" aria-hidden>
                <MdArrowBack />
              </span>
            </a>
            <span className="home-services__cta-line" aria-hidden />
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default Services;
