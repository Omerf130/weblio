import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProjectsNav from "../../components/projectsNav/ProjectsNav";
import Footer from "../../components/footer/Footer";
import { CONSTS } from "../../consts";
import { useInView } from "../../hooks/useInView";
import aboutPhoto from "../../assets/pics/about.jpeg";
import "./About.scss";

const AboutPage = () => {
  const ABOUT_PAGE = CONSTS.ABOUT_PAGE;
  const { META } = ABOUT_PAGE;
  const navigate = useNavigate();
  const [heroRef, heroInView] = useInView<HTMLElement>();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = META.TITLE;

    let metaDescription = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]'
    );
    const created = !metaDescription;
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    const previousContent = metaDescription.getAttribute("content") ?? "";
    metaDescription.setAttribute("content", META.DESCRIPTION);

    const htmlEl = document.documentElement;
    const previousLang = htmlEl.getAttribute("lang");
    htmlEl.setAttribute("lang", "he");

    return () => {
      document.title = previousTitle;
      if (previousContent && metaDescription) {
        metaDescription.setAttribute("content", previousContent);
      } else if (created && metaDescription?.parentNode) {
        metaDescription.parentNode.removeChild(metaDescription);
      }
      if (previousLang !== null) {
        htmlEl.setAttribute("lang", previousLang);
      }
    };
  }, [META.DESCRIPTION, META.TITLE]);

  return (
    <div className="about-page-wrapper" dir="rtl" lang="he">
      <ProjectsNav />
      <div className="about-page-container">
        <article className="about-page-content">
          <header
            ref={heroRef}
            className={`about-page-hero ${heroInView ? "about-page-hero--visible" : ""}`}
          >
            <div className="about-page-hero-img">
              <img
                src={aboutPhoto}
                alt="עומר — מפתח ומעצב אתרים, Weblio"
                loading="eager"
                decoding="async"
              />
            </div>
            <div className="about-page-hero-text">
              <h1 className="about-page-title">{ABOUT_PAGE.TITLE}</h1>
              {ABOUT_PAGE.INTRO.PARAGRAPHS.map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>
          </header>

          <section className="about-page-section">
            <h2 className="about-page-h2">{ABOUT_PAGE.APPROACH.TITLE}</h2>
            {ABOUT_PAGE.APPROACH.PARAGRAPHS.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </section>

          <section className="about-page-section">
            <h2 className="about-page-h2">{ABOUT_PAGE.SERVICES.TITLE}</h2>
            <ul className="about-page-cards">
              {ABOUT_PAGE.SERVICES.ITEMS.map((item) => (
                <li key={item} className="about-page-card">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="about-page-section">
            <h2 className="about-page-h2">{ABOUT_PAGE.HOW.TITLE}</h2>
            <div className="about-page-card-panel">
              <p>{ABOUT_PAGE.HOW.INTRO}</p>
              <ul className="about-page-list about-page-list-bulleted">
                {ABOUT_PAGE.HOW.ITEMS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="about-page-section">
            <h2 className="about-page-h2">{ABOUT_PAGE.GOAL.TITLE}</h2>
            {ABOUT_PAGE.GOAL.PARAGRAPHS.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </section>

          <section className="about-page-section about-page-cta">
            <h2 className="about-page-h2">{ABOUT_PAGE.CTA.TITLE}</h2>
            <p>{ABOUT_PAGE.CTA.CONTENT1}</p>
            <button
              type="button"
              className="about-page-cta-btn"
              onClick={() => navigate("/#contact")}
            >
              {ABOUT_PAGE.CTA.BUTTON}
            </button>
          </section>
        </article>
      </div>
      <Footer />
    </div>
  );
};

export default AboutPage;
