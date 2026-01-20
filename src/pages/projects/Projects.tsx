import { FaArrowLeftLong } from 'react-icons/fa6';
import Footer from '../../components/footer/Footer';
import ProjectsNav from '../../components/projectsNav/ProjectsNav';
import pic1 from '../../assets/pics/a-a.png';
import pic2 from '../../assets/pics/n-s.png';
import pic3 from '../../assets/pics/zoukopng.png';
import pic4 from '../../assets/pics/ganmetukim.png';
import pic5 from '../../assets/pics/pic5.jpeg';
import pic6 from '../../assets/pics/insta.jpeg';
import pic7 from '../../assets/pics/noah.jpeg';
import "./Projects.scss";
import { useEffect } from 'react';

const Projects = () => {
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }, []);

    const projectList = [
        { title: "נזי שרון", subtitle: "מעצבת פנים", src: pic2, to: "https://n-s-tau.vercel.app/" },
        { title: "אטיאס אשכנזי ושות'", subtitle: "משרד עורכי דין", src: pic1, to: "https://a-a-topaz.vercel.app/" },
        { title: "זוקו", subtitle: "", src: pic3, to: "https://zoukoisrael.com/" },
        { title: "גן מתוקים", subtitle: "", src: pic4, to: "https://ganmetukim.co.il" },
        { title: "דור - מאמן כדורסל", subtitle: "", src: pic5, to: "https://basketball-umber-theta.vercel.app/" },
        { title: "עדן - דודי שמש", subtitle: "דודי שמש ואינסטלציה", src: pic6, to: "https://www.eden-shemesh.co.il/" },
        { title: "נוח - סטודנטים לסיעוד", subtitle: "סטודנטים לסיעוד", src: pic7, to: "https://www.noah-sn.co.il/" },
    ];

    return (
        <>
            <ProjectsNav />
            <div className="project-page-container">

                <div className="project-page-content-wrapper">
                    <h1 className="project-page-title">פרוייקטים</h1>

                    <ul className="project-page-ul">
                        {projectList.map((project) => (
                            <li className="project-page-list-item" key={project.title}>
                                <a href={project.to} target="_blank">
                                    <div className="project-page-card-content">
                                        <div className="project-page-card-title">{project.title}</div>
                                        <div className="project-page-card-subtitle">{project.subtitle}</div>

                                        <div className="project-page-button">
                                            <span>Take me</span>
                                            <FaArrowLeftLong className="project-page-arrow" />
                                        </div>
                                    </div>

                                    <img className="project-page-img" src={project.src} />
                                </a>
                            </li>
                        ))}
                    </ul>

                    <h2 className="project-page-bottom-text">
                        פרוייקטים נוספים בקרוב
                    </h2>
                </div>

            </div>
            <Footer />
        </>
    );
};

export default Projects;
