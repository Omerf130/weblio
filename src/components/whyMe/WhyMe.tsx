import { motion } from "framer-motion";
import { FaPencilAlt } from "react-icons/fa";
import { LuClock4 } from "react-icons/lu";
import { CiSearch } from "react-icons/ci";
import { FaHeadset } from "react-icons/fa6";
import { IoIosSettings } from "react-icons/io";
import Reveal, { staggerItem, staggerParent } from "../motion/Reveal";
import "./WhyMe.scss";

const SIZE = 24;

const WhyMe = () => {
  const dataCards = [
    { title: "עיצוב ייחודי", subtitle: "כל אתר שאנחנו בונים הוא ייחודי ומותאם אישית לצרכים שלך ולאופי של העסק שלך.", img: <FaPencilAlt className='img spin' size={SIZE}/> },
    { title: "ביצועים מהירים", subtitle: "האתרים שלנו נבנים עם דגש על מהירות טעינה ואוטימיזציה לחוויית משתמש מעולה.", img: <LuClock4 className='img spin' size={SIZE}/> },
    { title: "מותאם ל-SEO", subtitle: "אנחנו בונים אתרים שמותאמים למנועי חיפוש כדי לעזור לך להופיע גבוה בתוצאות החיפוש", img: <CiSearch className='img spin' size={SIZE}/> },
    { title: "תמיכה מעולה", subtitle: "אנחנו כאן בשבילך בכל שלב, מהתכנון הראשוני ועד לאחר השקת האתר", img: <FaHeadset className='img spin' size={SIZE}/> },
    { title: "פתרונות מתקדמים", subtitle: "אנחנו משתמשים בטכנולוגיות החדשיות ביותר כדי לספק לך את הפתרונות הטובים ביותר", img: <IoIosSettings className='img spin' size={SIZE}/> },
  ];

  return (
    <div className='whyme-container' id="whyme">
      <Reveal as="h1" className="whyme-heading">
        למה אני?
      </Reveal>
      <motion.div
        className="whyme-cards"
        variants={staggerParent}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        {dataCards.map((card) => (
          <motion.div className="card" key={card.title} variants={staggerItem}>
            <div className="card-img">{card.img}</div>
            <div className="card-title">{card.title}</div>
            <div className="card-subtitle">{card.subtitle}</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default WhyMe;
