import './WhyMe.scss'
import { FaPencilAlt } from "react-icons/fa";
import { LuClock4 } from "react-icons/lu";
import { CiSearch } from "react-icons/ci";
import { FaHeadset } from "react-icons/fa6";
import { IoIosSettings } from "react-icons/io";
const SIZE = 24;

const WhyMe = () => {
  const dataCards = [
    {title: "עיצוב ייחודי", subtitle: "כל אתר שאנחנו בונים הוא ייחודי ומותאם אישית לצרכים שלך ולאופי של העסק שלך.", img: <FaPencilAlt className='img spin' size={SIZE}/>},
    {title: "ביצועים מהירים", subtitle: "האתרים שלנו נבנים עם דגש על מהירות טעינה ואוטימיזציה לחוויית משתמש מעולה.", img: <LuClock4 className='img spin' size={SIZE}/>},
    {title: "מותאם ל-SEO", subtitle: "אנחנו בונים אתרים שמותאמים למנועי חיפוש כדי לעזור לך להופיע גבוה בתוצאות החיפוש", img: <CiSearch className='img spin' size={SIZE}/>},
    {title: "תמיכה מעולה", subtitle: "אנחנו כאן בשבילך בכל שלב, מהתכנון הראשוני ועד לאחר השקת האתר", img: <FaHeadset className='img spin' size={SIZE}/>},
    {title: "פתרונות מתקדמים", subtitle: "אנחנו משתמשים בטכנולוגיות החדשיות ביותר כדי לספק לך את הפתרונות הטובים ביותר", img: <IoIosSettings className='img spin' size={SIZE}/>}
  ]
  return (
    <div className='whyme-container'>
      <h1>למה אני?</h1>
      <div className="whyme-cards">
        {dataCards.map((card) => (
          <div className="card">
            <div className="card-img">{card.img}</div>
            <div className="card-title">{card.title}</div>
            <div className="card-subtitle">{card.subtitle}</div>
          </div>
          )
        )}
      </div>
    </div>
  )
}

export default WhyMe