import { CONSTS } from "../../consts";
import { useInView } from "../../hooks/useInView";
import './About.scss'

const About = () => {
  const {ABOUT:{TITLE, CONTENT1, CONTENT2, CONTENT3}} = CONSTS;
  const [ref, isInView] = useInView<HTMLDivElement>();
  return (
    <div className='about-container' id="about">
      <div className='about-content'>
        <h1 className={isInView ? "slide-top" : ""} ref={ref}>{TITLE}</h1>
        <h3>{CONTENT1} {CONTENT2} {CONTENT3}</h3>
      </div>
      <div className="about-img">
        <img src="https://plus.unsplash.com/premium_photo-1681666713641-8d722b681edc?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8d2Vic2l0ZXxlbnwwfHwwfHx8MA%3D%3D" alt="web dev" />
      </div>
    </div>
  )
}

export default About