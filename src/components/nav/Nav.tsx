"use client";

import "./Nav.scss";
import useWindowWidth from "../../hooks/useWindowWidth";
import { GiHamburgerMenu } from "react-icons/gi";
import { useState } from "react";

const Nav = () => {
  const isMobile = useWindowWidth(640);
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { text: "קצת עליי", href: "#about" },
    { text: "שירותים", href: "/services" },
    { text: "פרוייקטים", href: "#projects" },
    { text: "צור קשר", href: "#contact" },
  ];

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <div className="nav-container">
      {isMobile ? (
        <div className="nav-wrapper-mobile">
          <a href="#" className="logo">
            <span className="logo-mark" />
            <span className="logo-text"><em>web</em>lio</span>
          </a>
          <div className="nav">
            <GiHamburgerMenu
              className={`hamburger ${isOpen && "open"}`}
              onClick={() => setIsOpen(!isOpen)}
            />
            <nav className={`nav-list ${isOpen ? "show" : ""}`}>
              {navLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.href}
                  className="link-wrapper"
                  onClick={handleLinkClick}
                >
                  <div className="text">{link.text}</div>
                  <div className="underline" />
                </a>
              ))}
            </nav>
          </div>
        </div>
      ) : (
        <div className="nav-wrapper">
          <a href="#" className="logo">
            <span className="logo-mark" />
            <span className="logo-text"><em>web</em>lio</span>
          </a>
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
