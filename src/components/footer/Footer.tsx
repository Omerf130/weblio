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
      
      <div className="footer-section footer-brand">
        <h2>Weblio</h2>
        <p>אנחנו יוצרים חוויות דיגיטליות מרשימות שמביאות את העסק שלך לשלב הבא. עם תשומת לב לפרטים ומומחיות טכנולוגית.</p>
      </div>
      
      <div className="footer-section">
        <h3>עקבו אחרינו</h3>
        <div className="footer-media">
          <SiInstagram className="media" />
          <FaLinkedin className="media"/>
        </div>
      </div>

      <div className="footer-section">
        <h3>קישורים מהירים</h3>
        <div className="footer-links">
          {location.pathname === "/" && links.map((link) => (
            <FooterLinkItem key={link.href} href={link.href} text={link.text} />
          ))}
        </div>
      </div>

      <div className="footer-copyrights">
        <p>© 2025 Weblio. כל הזכויות שמורות.</p>
      </div>
    </footer>
  );
};

export default Footer;
