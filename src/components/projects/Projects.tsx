import { motion } from "framer-motion";
import { FaArrowLeftLong } from "react-icons/fa6";
import pic4 from "../../assets/pics/lace.jpeg";
import pic2 from "../../assets/pics/shiputi.jpeg";
import pic1 from "../../assets/pics/jozeglaperfume.jpeg";
import pic5 from "../../assets/pics/clean.jpeg";
import { useNavigate } from "react-router-dom";
import Reveal, { staggerItem, staggerParent } from "../motion/Reveal";
import "./Projects.scss";

const Projects = () => {
  const navigate = useNavigate();
  const projectList = [
    {
      title: "בלוג משפטי",
      subtitle: "בלוג משפטי למשרד עורכי דין",
      src: pic2,
      to: "https://shiputi.co.il/",
    },
    {
      title: "lace",
      subtitle: "סוכנות דוגמנות",
      src: pic4,
      to: "https://www.lacemodel.com/",
    },
    {
      title: "jozef la perfume",
      subtitle: "חנות בשמים",
      src: pic1,
      to: "https://www.jozeflaperfume.co.il/",
    },
    {
      title: "מבריק 100",
      subtitle: "חברת ניקיון",
      src: pic5,
      to: "https://clean-seven-rho.vercel.app/",
    },
  ];

  return (
    <div className="project-container" id="projects">
      <Reveal as="h1" className="project-heading">
        פרוייקטים
      </Reveal>
      <motion.ul
        className="project-ul"
        variants={staggerParent}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        {projectList.map((project) => (
          <motion.li
            className="project-list-item"
            key={project.title}
            variants={staggerItem}
          >
            <a href={project.to} target="_blank" rel="noopener noreferrer">
              <div className="project-content">
                <div className="project-title">{project.title}</div>
                <div className="project-subtitle">{project.subtitle}</div>
                <div className="project-button">
                  <span>Take me</span>
                  <FaArrowLeftLong className="arrow" />
                </div>
              </div>
              <img className="project-img" src={project.src} alt={project.title} />
            </a>
          </motion.li>
        ))}
      </motion.ul>
      <Reveal delay={0.05}>
        <button
          type="button"
          className="project-btn"
          onClick={() => navigate("/projects")}
        >
          לפרויקטים נוספים
        </button>
      </Reveal>
    </div>
  );
};

export default Projects;
