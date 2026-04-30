import { CONSTS } from "../../consts";
import { useInView } from "../../hooks/useInView";
import "./Hero.scss";

const Hero = () => {
  const {
    HERO: { TITLE, CONTENT, BUTTON },
  } = CONSTS;
  const [ref, isInView] = useInView<HTMLDivElement>();

  return (
    <div className="hero-container">
      <div className="hero-content" ref={ref}>
        <span className="hero-label">מפתח אתרים ופתרונות דיגיטליים</span>
        <h1 className={isInView ? "slide-top" : ""}>{TITLE}</h1>
        <p>{CONTENT}</p>
        <a className="btn-primary" href="#contact">{BUTTON}</a>
      </div>
    </div>
  );
};

export default Hero;
