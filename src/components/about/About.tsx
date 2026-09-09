import { CONSTS } from "../../consts";
import { assetSrc } from "../../utils/assetSrc";
import aboutPhoto from "../../assets/pics/about.jpeg";
import Reveal from "../motion/Reveal";
import "./About.scss";

const About = () => {
  const { TITLE, PARAGRAPHS, STATEMENT, PILLARS, BUTTON } = CONSTS.ABOUT;

  return (
    <section className="about" id="about" dir="rtl">
      <div className="about__bg-text" aria-hidden="true">
        ABOUT
      </div>

      <div className="about__inner">
        {/* Portrait composition — left column */}
        <Reveal className="about__portrait" y={32} amount={0.15}>
          <div className="about__portrait-glow" aria-hidden="true" />
          <div className="about__portrait-frame about__portrait-frame--far" aria-hidden="true" />
          <div className="about__portrait-frame about__portrait-frame--near" aria-hidden="true" />
          <div className="about__portrait-img">
            <img
              src={assetSrc(aboutPhoto)}
              alt="עומר — מפתח ומעצב אתרים, Weblio"
              loading="lazy"
              decoding="async"
            />
          </div>
          <span className="about__founder-label">
            <strong>OMER</strong>
            <span>FOUNDER, WEBLIO</span>
          </span>
          <span className="about__detail-coord" aria-hidden="true">32.08°N</span>
          <span className="about__detail-note" aria-hidden="true">design &amp; code</span>
          <span className="about__detail-dot" aria-hidden="true" />
        </Reveal>

        {/* Content — right column */}
        <div className="about__content">
          <Reveal as="span" className="about__eyebrow" delay={0.05}>
            ABOUT WEBLIO —
          </Reveal>

          <Reveal as="h2" className="about__heading" delay={0.1}>
            {TITLE.split("\n").map((line, i) => (
              <span key={i}>
                {i === 0 ? (
                  <>
                    {line}
                    <br />
                  </>
                ) : (
                  <span className="about__heading-accent" dir="ltr">
                    {line}
                  </span>
                )}
              </span>
            ))}
          </Reveal>

          <Reveal className="about__story" delay={0.18}>
            {PARAGRAPHS.map((p) => (
              <p key={p.slice(0, 20)}>{p}</p>
            ))}
          </Reveal>

          <Reveal as="div" className="about__statement" delay={0.25}>
            <span className="about__statement-mark" aria-hidden="true">
              ״
            </span>
            <blockquote>
              {STATEMENT.split("\n").map((line, i) => (
                <span key={i}>
                  {line}
                  {i === 0 && <br />}
                </span>
              ))}
            </blockquote>
          </Reveal>

          <Reveal className="about__pillars" delay={0.32}>
            {PILLARS.map((pillar, i) => (
              <div className="about__pillar" key={pillar.label}>
                <span className="about__pillar-index" aria-hidden="true">
                  0{i + 1}
                </span>
                <span className="about__pillar-label">{pillar.label}</span>
                <span className="about__pillar-text">{pillar.text}</span>
              </div>
            ))}
          </Reveal>

          <Reveal delay={0.38}>
            <a href="/about" className="about__cta">
              <span>{BUTTON}</span>
              <span className="about__cta-arrow" aria-hidden="true">
                ←
              </span>
            </a>
          </Reveal>
        </div>
      </div>

      <div className="about__micro" aria-hidden="true">
        BUILD WITH PURPOSE
      </div>
    </section>
  );
};

export default About;
