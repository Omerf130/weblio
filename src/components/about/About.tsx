import { CONSTS } from "../../consts";
import { useInView } from "../../hooks/useInView";
import { assetSrc } from "../../utils/assetSrc";
import aboutPhoto from "../../assets/pics/about.jpeg";
import "./About.scss";

const About = () => {
  const {
    ABOUT: { TITLE, GREETING, PARAGRAPHS, BUTTON },
  } = CONSTS;
  const [headingRef, headingInView] = useInView<HTMLHeadingElement>();
  const [imgRef, imgInView] = useInView<HTMLDivElement>();

  return (
    <div className="about-container" id="about">
      <div className="about-content">
        <h1
          ref={headingRef}
          className={headingInView ? "slide-top" : ""}
        >
          {TITLE}
        </h1>
        <p className="about-greeting">{GREETING}</p>
        {PARAGRAPHS.map((paragraph) => (
          <p key={paragraph.slice(0, 24)} className="about-paragraph">
            {paragraph}
          </p>
        ))}
        <a href="/about" className="about-btn">
          {BUTTON}
        </a>
      </div>
      <div
        ref={imgRef}
        className={`about-img ${imgInView ? "about-img--visible" : ""}`}
      >
        <img
          src={assetSrc(aboutPhoto)}
          alt="עומר — מפתח ומעצב אתרים, Weblio"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
};

export default About;
