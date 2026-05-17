import { useNavigate } from "react-router-dom";
import { CONSTS } from "../../consts";
import { useInView } from "../../hooks/useInView";
import aboutHeroImg from "../../assets/pics/computer (1).webp";
import "./About.scss";

const About = () => {
  const {ABOUT:{TITLE, CONTENT1, CONTENT2, CONTENT3, BUTTON}} = CONSTS;
  const [ref, isInView] = useInView<HTMLDivElement>();
  const navigate = useNavigate();
  return (
    <div className='about-container' id="about">
      <div className='about-content'>
        <h1 className={isInView ? "slide-top" : ""} ref={ref}>{TITLE}</h1>
        <h3>{CONTENT1} {CONTENT2} {CONTENT3}</h3>
        <button className="about-btn" onClick={() => navigate("/about")}>
          {BUTTON}
        </button>
      </div>
      <div className="about-img">
        <img
          src={aboutHeroImg}
          alt="עבודה על פיתוח ועיצוב אתרים מול מסך מחשב — נוכחות דיגיטלית מקצועית"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  )
}

export default About
