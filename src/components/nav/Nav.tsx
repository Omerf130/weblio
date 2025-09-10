import "./Nav.scss";
import useWindowWidth from "../../hooks/useWindowWidth";
import { GiHamburgerMenu } from "react-icons/gi";
import { useState } from "react";

const Nav = () => {
  const isMobile = useWindowWidth(640);
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { text: "מי אנחנו", href: "" },
    { text: "שירותים", href: "" },
    { text: "פרוייקטים", href: "" },
    { text: "צור קשר", href: "" },
  ];

  console.log("isMobile",isMobile)

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
              {navLinks.map((link, i) => (
                <a key={i} href={link.href} className="link-wrapper">
                  <div className="text">{link.text}</div>
                  <div className="underline" />
                </a>
              ))}
            </nav>
          </div>
        </div>
      ) : (
        <div className="nav-wrapper">
          <div className="logo" />
          <nav className="nav-list">
            {navLinks.map((link, i) => (
              <a key={i} href={link.href} className="link-wrapper">
                <div className="text">{link.text}</div>
                <div className="underline" />
              </a>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
};

export default Nav;
