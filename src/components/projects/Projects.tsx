import "./Projects.scss";
import { FaArrowLeftLong } from "react-icons/fa6";
import pic1 from '../../assets/pics/a-a.png'
import pic2 from '../../assets/pics/shiputi.jpeg'
import pic3 from '../../assets/pics/zoukopng.png'
import pic5 from '../../assets/pics/clean.jpeg'
import { useNavigate } from "react-router-dom";

const Projects = () => {
  const navigate = useNavigate();
  const projectList = [
    {
      title: "בלוג משפטי",
      subtitle: "בלוג משפטי למשרד עורכי דין",
      src: pic2,
      to: "https://shiputi.co.il/"
    },
    {
      title: "אטיאס אשכנזי ושות'",
      subtitle: "משרד עורכי דין",
      src: pic1,
      to:"https://a-a-topaz.vercel.app/"
    },
    {
      title: "זוקו",
      subtitle: "שיעורי ריקוד מקצועיים",
      src: pic3,
      to:"https://zoukoisrael.com/"
    },
    {
      title: "מבריק 100",
      subtitle: "חברת ניקיון",
      src: pic5,
      to:"https://clean-seven-rho.vercel.app/"
    },
  ];
  return (
    <div className="project-container" id="projects">
      <h1 className="project-h1">פרוייקטים</h1>
      <ul className="project-ul">
        {projectList.map((project) => (
          <li className="project-list-item" key={project.title}>
            <a href={project.to} target="blank">
              <div className="project-content">
                <div className="project-title">{project.title}</div>
                <div className="project-subtitle">{project.subtitle}</div>
                <div className="project-button">
                  <span>Take me</span>
                  <FaArrowLeftLong className="arrow" />
                </div>
              </div>
              <img className="project-img" src={project.src} />
            </a>
          </li>
        ))}
      </ul>
      <button className="project-btn" onClick={() => navigate("/projects")}>לפרוקטים נוספים</button>
    </div>
  );
};

export default Projects;
