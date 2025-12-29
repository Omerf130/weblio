import "./Projects.scss";
import { FaArrowLeftLong } from "react-icons/fa6";
import pic1 from '../../assets/pics/a-a.png'
import pic2 from '../../assets/pics/n-s.png'
import pic3 from '../../assets/pics/zoukopng.png'
import pic4 from '../../assets/pics/ganmetukim.png'
import { useNavigate } from "react-router-dom";

const Projects = () => {
  const navigate = useNavigate();
  const projectList = [
    {
      title: "נזי שרון",
      subtitle: "מעצבת פנים",
      src: pic2,
      to: "https://n-s-tau.vercel.app/"
    },
    {
      title: "אטיאס אשכנזי ושות'",
      subtitle: "A test subtitle for example",
      src: pic1,
      to:"https://a-a-topaz.vercel.app/"
    },
    {
      title: "זוקו",
      subtitle: "A test subtitle for example",
      src: pic3,
      to:"https://zoukoisrael.com/"
    },
    {
      title: "גן מתוקים",
      subtitle: "A test subtitle for example",
      src: pic4,
      to:"https://ganmetukim.co.il"
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
