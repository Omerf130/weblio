import { CONSTS } from "../../consts";
import './Hero.scss'

const Hero = () => {
  const {HERO:{TITLE, CONTENT, BUTTON}} = CONSTS;

  return (
    <div className="hero-container">
      <div className="hero-content">
        <h1>{TITLE}</h1>
        <p>{CONTENT}</p>
        <button className="btn-primary">{BUTTON}</button>
      </div>
      <div className="hero-img">
        <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjZ8fHdlYnNpdGV8ZW58MHx8MHx8fDA%3D" alt="web dev" />
      </div>
    </div>
  );
};

export default Hero;