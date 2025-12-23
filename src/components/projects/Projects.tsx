import "./Projects.scss";
import { FaArrowLeftLong } from "react-icons/fa6";
import pic1 from '../../assets/pics/a-a.png'
import pic2 from '../../assets/pics/n-s.png'
import pic3 from '../../assets/pics/zoukopng.png'
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
      title: "project2",
      subtitle: "A test subtitle for example",
      src: pic1,
      to:"https://a-a-topaz.vercel.app/"
    },
    {
      title: "project3",
      subtitle: "A test subtitle for example",
      src: pic3,
      to:"https://zoukoisrael.com/"
    },
    {
      title: "project4",
      subtitle: "A test subtitle for example",
      src: "https://plus.unsplash.com/premium_photo-1681666713641-8d722b681edc?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8d2Vic2l0ZXxlbnwwfHwwfHx8MA%3D%3D",
      to:""
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
      <button onClick={() => navigate("/projects")}>לפרוקטים נוספים</button>
    </div>
  );
};

export default Projects;
