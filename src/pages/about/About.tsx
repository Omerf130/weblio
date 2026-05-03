import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProjectsNav from "../../components/projectsNav/ProjectsNav";
import Footer from "../../components/footer/Footer";
import { CONSTS } from "../../consts";
import "./About.scss";

const AboutPage = () => {
  const { ABOUT_PAGE } = CONSTS;
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="about-page-wrapper">
      <ProjectsNav />
      <div className="about-page-container">
        <article className="about-page-content">
          <h1 className="about-page-title">{ABOUT_PAGE.TITLE}</h1>

          <section className="about-page-section about-page-intro">
            <p className="about-page-greeting">{ABOUT_PAGE.INTRO.GREETING}</p>
            <p>{ABOUT_PAGE.INTRO.ROLE}</p>
            <p>{ABOUT_PAGE.INTRO.DESCRIPTION}</p>
          </section>

          <section className="about-page-section">
            <h2 className="about-page-h2">{ABOUT_PAGE.SERVICES.TITLE}</h2>
            <ul className="about-page-list">
              {ABOUT_PAGE.SERVICES.ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="about-page-section">
            <h2 className="about-page-h2">{ABOUT_PAGE.HOW.TITLE}</h2>
            <p>{ABOUT_PAGE.HOW.INTRO}</p>
            <ul className="about-page-list about-page-list-bulleted">
              {ABOUT_PAGE.HOW.ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="about-page-section">
            <h2 className="about-page-h2">{ABOUT_PAGE.WHY.TITLE}</h2>
            <ul className="about-page-list">
              {ABOUT_PAGE.WHY.ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="about-page-section">
            <h2 className="about-page-h2">{ABOUT_PAGE.GOAL.TITLE}</h2>
            <p>{ABOUT_PAGE.GOAL.CONTENT}</p>
          </section>

          <section className="about-page-section about-page-cta">
            <h2 className="about-page-h2">{ABOUT_PAGE.CTA.TITLE}</h2>
            <p>{ABOUT_PAGE.CTA.CONTENT1}</p>
            <p>{ABOUT_PAGE.CTA.CONTENT2}</p>
            <button
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
