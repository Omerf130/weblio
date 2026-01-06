import { SiInstagram } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";
import "./Footer.scss";
import FooterLinkItem from "./FooterLinkItem";
import { useLocation } from "react-router-dom";

const links = [
  // { text: "hero", href: "#hero" },
  { text: "פרוייקטים", href: "#projects" },
  { text: "שירותים", href: "#services" },
  { text: "למה אני", href: "#whyme" },
  { text: "מי אנחנו", href: "#about" },
];

const Footer = () => {
  const location = useLocation();
  return (
    <footer className="footer">
      <div className="footer-links">
        {location.pathname === "/" && links.map((link) => (
          <FooterLinkItem key={link.href} href={link.href} text={link.text} />
        ))}
      </div>
      <div className="footer-media">
        <SiInstagram className="media red" />
        <FaLinkedin className="media red"/>
      </div>
      <div className="footer-copyrights">
        <p>© weblio 2025</p>
      </div>
    </footer>
  );
};

export default Footer;
