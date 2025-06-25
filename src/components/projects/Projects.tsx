import React from "react";
import "./Projects.scss";
import { FaArrowRightLong } from "react-icons/fa6";

const Projects = () => {
  const projectList = [
    {
      title: "project1",
      subtitle: "A test subtitle for example",
      src: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8d2Vic2l0ZXxlbnwwfHwwfHx8MA%3D%3D",
    },
    {
      title: "project2",
      subtitle: "A test subtitle for example",
      src: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8d2Vic2l0ZXxlbnwwfHwwfHx8MA%3D%3D",
    },
    {
      title: "project3",
      subtitle: "A test subtitle for example",
      src: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8d2Vic2l0ZXxlbnwwfHwwfHx8MA%3D%3D",
    },
    {
      title: "project4",
      subtitle: "A test subtitle for example",
      src: "https://plus.unsplash.com/premium_photo-1681666713641-8d722b681edc?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8d2Vic2l0ZXxlbnwwfHwwfHx8MA%3D%3D",
    },
  ];
  return (
    <div className="project-container">
      <h1 className="project-h1">פרוייקטים</h1>
      <ul className="project-ul">
        {projectList.map((project) => (
          <li className="project-list-item">
            <div className="project-content">
              <div className="project-title">{project.title}</div>
              <div className="project-subtitle">{project.subtitle}</div>
              <div className="project-button">
                <span>Take me</span>
                <FaArrowRightLong className="arrow"/>
                </div>
            </div>
            <img className="project-img" src={project.src} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Projects;
