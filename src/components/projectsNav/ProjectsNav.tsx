import { useNavigate } from "react-router-dom";
import "./ProjectsNav.scss";

const ProjectsNav = () => {
    const navigate = useNavigate();

    return (
        <div className="nav-container">
            <div className="nav-wrapper">
                <a className="logo" onClick={() => navigate("/")}>
                  <span className="logo-mark" />
                  <span className="logo-text"><em>web</em>lio</span>
                </a>
                
            </div>
        </div>
    );
};

export default ProjectsNav;
