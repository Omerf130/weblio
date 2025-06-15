import "./Nav.scss";
import useWindowWidth from "../../hooks/useWindowWidth";
import { GiHamburgerMenu } from "react-icons/gi";
import { useState } from "react";

const Nav = () => {
  const isMobile = useWindowWidth(640);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="nav-container">
      {isMobile ? (
        <div className="nav-wrapper-mobile">
          <div className="logo" />
          <div className="nav">
            <GiHamburgerMenu
              className={`hamburger ${isOpen && "open"}`}
              onClick={() => setIsOpen(!isOpen)}
            />
            <nav className={`nav-list ${isOpen && "show"}`}>
              <a href="">פרויקטים</a>
              <a href="">קצת עליי</a>
              <a href="">צור קשר</a>
            </nav>
          </div>
        </div>
      ) : (
        <div className="nav-wrapper">
          <div className="logo" />
          <nav className="nav-list">
            <a href="">פרויקטים</a>
            <a href="">קצת עליי</a>
            <a href="">צור קשר</a>
          </nav>
        </div>
      )}
    </div>
  );
};

export default Nav;
