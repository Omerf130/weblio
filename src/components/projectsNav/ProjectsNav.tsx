import { useNavigate } from "react-router-dom";
import "./ProjectsNav.scss";

const ProjectsNav = () => {
    const navigate = useNavigate();

    return (
        <div className="nav-container">
            <div className="nav-wrapper">
                <div className="logo" onClick={() => navigate("/")}/>
                
            </div>
        </div>
    );
};

export default ProjectsNav;
