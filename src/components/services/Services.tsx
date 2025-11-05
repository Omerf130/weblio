import { FaCode } from "react-icons/fa";
import { BsCartCheckFill } from "react-icons/bs";
import { IoIosPhonePortrait } from "react-icons/io";
import { FaPencilAlt } from "react-icons/fa";
import { IoSearchOutline } from "react-icons/io5";
import { IoIosMegaphone } from "react-icons/io";
import { useInView } from '../../hooks/useInView';
import './Services.scss'

const SIZE = 24;
const Services = () => {
  const [ref, isInView] = useInView<HTMLDivElement>();

  const cardsData = [
    {title: "אתרי תדמית", subtitle: "אתרים מרשימים שמציגים את העסק שלך בצורה מקצועית  ומושכת לקוחות חדשים", img: <FaCode className='img spin' size={SIZE}/>,list:["🔝 - עיצוב מותאם אישית","🔝 - חוויית משתמש מעולה","🔝 - מותאם למובייל"]},
    {title: "חנויות אונליין", subtitle: "חנויות מקוונות מתקדמות שמאפשרות לך למכור את המוצרים שלך בקלות", img: <BsCartCheckFill className='img spin' size={SIZE}/>,list:["🔝 - ממשק ניהול קל לשימוש","🔝 - אמצעי תשלום מאובטחים","🔝 - ניהול מלאי ומשלוחים"]},
    {title: "אתרים מותאמים למובייל", subtitle: "אתרים רספונסיביים שנראים ועובדים מצויין בכל מכשיר", img: <IoIosPhonePortrait className='img spin' size={SIZE}/>,list:["🔝 - התאמה לכל גודל מסך","🔝 - טעינה מהירה","🔝 - חוויית משתמש אופטימלית"]},
    {title: "עיצוב גרפי", subtitle: "עיצובים מרהיבים שמשקפים את הזהות של העסק שלך", img: <FaPencilAlt className='img spin' size={SIZE}/>,list:["🔝 - עיצוב לוגו","🔝 - מיתוג עסקי","🔝 - חומרי שיווק"]},
    {title: "קידום אורגני", subtitle: "אסטרטגיות SEO מתקדמות שיעזרו לאתר שלך להופיע גבוה בתוצאות חיפוש", img: <IoSearchOutline className='img spin' size={SIZE}/>,list:["🔝 - מחקר מילות מפתח","🔝 - אופטימיזציה טכנית","🔝 - בניית קישורים איכותיים"]},
    {title: "שייוק דיגיטלי", subtitle: "אסטרטגיות שיווק שיעזרו לך להגיע ללקוחות חדשים ולהגדיל את המכירות", img: <IoIosMegaphone className='img spin' size={SIZE}/>,list:["🔝 - ניהול רשתות חברתיות","🔝 - קמפיינים ממומנים","🔝 - שיווק בדואר אלקטרוני"]}
  ]

  return (
    <div className='services-container'>
      <h1 className={isInView ? "slide-top" : ""} ref={ref}>השירותים שלנו</h1>
      <div className='services-cards'>
        {cardsData.map((card) => (
          <div className='card'>
            <div className='card-img'>
              {card.img}
            </div>
            <div className='card-title'>
              {card.title}
            </div>
            <div className='card-subtitle'>
              {card.subtitle}
            </div>
            <div className="card-list">{card.list.map((string) => (
              <div>{string}</div>
            ))}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Services