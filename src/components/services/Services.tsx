import React from 'react'
import { FaCode } from "react-icons/fa";
import './services.scss'
import { useInView } from '../../hooks/useInView';

const SIZE = 24;
const Services = () => {
  const [ref, isInView] = useInView<HTMLDivElement>();

  const cardsData = [
    {title: "פיתוח אתרים מאפס", subtitle: "בניית אתרים ייחודיים בקוד מותאם אישית, המשלבים עיצוב עם פונקציונליות מתקדמת ומהירות טעינה מיטבית.", img: <FaCode className='img spin' size={SIZE}/>},
    {title: "חוויות תלת-מימד", subtitle: "שילוב חוויות אינטראקטיביות בתלת-מימד להצגת מוצרים, סיורים וירטואליים ויצירת חוויות משתמש בלתי נשכחות.", img: <FaCode className='img spin' size={SIZE}/>},
    {title: "עיצוב גרפי", subtitle: "עיצוב מקצועי של לוגואים, מיתוג, חומרים שיווקיים ועיצוב ממשק משתמש (UI/UX) בסטנדרטים הגבוהים ביותר.", img: <FaCode className='img spin' size={SIZE}/>},
    {title: "צילומי תדמית", subtitle: "צילומים מקצועיים שמציגים את העסק שלך בצורה הטובה ביותר, מושכים תשומת לב ומעבירים את המסר שלך בדיוק כפי שהתכוונת.", img: <FaCode className='img spin' size={SIZE}/>},
    {title: "קידום אורגני", subtitle: "תשתית SEO מובנית באתר שלך מהיסוד, עם פתרונות טכניים מתקדמים שיעזרו לך להגיע למקומות הראשונים בגוגל.", img: <FaCode className='img spin' size={SIZE}/>},
    {title: "אוטומציות ובוטים", subtitle: "פיתוח מערכות אוטומטיות וצ'אטבוטים חכמים שחוסכים לך זמן, מייעלים תהליכים ומשפרים את השירות ללקוחות.", img: <FaCode className='img spin' size={SIZE}/>}
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
          </div>
        ))}
      </div>
    </div>
  )
}

export default Services