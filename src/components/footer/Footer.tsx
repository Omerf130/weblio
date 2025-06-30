import { SiInstagram } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";
import "./Footer.scss";
import FooterLinkItem from "./FooterLinkItem";

const links = [
  { text: "hero", href: "#hero" },
  { text: "about", href: "#about" },
  { text: "services", href: "#services" },
  { text: "projects", href: "#projects" },
  { text: "why me?", href: "#whyme" },
  { text: "contact", href: "#contact" },
];

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-links">
        {links.map((link) => (
          <FooterLinkItem key={link.href} href={link.href} text={link.text} />
        ))}
      </div>
      <div className="footer-media">
        <SiInstagram className="media red" />
        <FaLinkedin className="media red"/>
      </div>
      <div className="footer-copyrights">
        <p>© 2020 Empathy template</p>
      </div>
    </footer>
  );
};

export default Footer;
