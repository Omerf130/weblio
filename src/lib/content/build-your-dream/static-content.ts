import type { BuildYourDreamContent } from "./types";

const PLACEHOLDER = (id: string, label: string, w: number, h: number) => ({
  id,
  src: `https://placehold.co/${w}x${h}/FFF4E8/EA580C/png?text=${encodeURIComponent(label)}`,
  alt: label,
  width: w,
  height: h,
});

export const STATIC_BUILD_YOUR_DREAM_CONTENT: BuildYourDreamContent = {
  meta: {
    title: "5 טעויות לפני שבונים אתר לעסק | מדריך חינמי",
    description:
      "מדריך קצר וחינמי שיעזור לכם להבין מה חשוב לבדוק לפני שמתחילים לבנות אתר — כדי לקבל החלטות טובות יותר ולהימנע מהוצאות מיותרות.",
  },
  images: {
    hero: { ...PLACEHOLDER("hero", "Hero Preview", 720, 540), priority: true },
    splitPrimary: PLACEHOLDER("split-1", "Design Preview", 640, 480),
    splitSecondary: PLACEHOLDER("split-2", "Results Preview", 640, 480),
  },
  hero: {
    eyebrow: "מתכננים לבנות אתר לעסק? חכו רגע.",
    title: "5 טעויות שכדאי להכיר לפני שבונים את האתר הראשון לעסק",
    subtitle:
      "הכנתי מדריך קצר וחינמי שיעזור לכם להבין מה באמת חשוב לבדוק לפני שמתחילים — כדי לקבל החלטות טובות יותר, להימנע מהוצאות מיותרות ולבנות אתר שבאמת מתאים לעסק שלכם.",
    ctaPrimary: { label: "אני רוצה את המדריך", action: "scroll-to-form" },
    ctaSecondary: { label: "מה מחכה לי במדריך?", action: "scroll-to-form" },
  },
  benefits: {
    title: "כמה דקות קריאה שיכולות לחסוך לכם הרבה כאב ראש",
    subtitle: "כל מה שצריך לדעת לפני שמתחילים — במדריך קצר אחד.",
    items: [
      {
        id: "choose-right",
        icon: "sparkles",
        title: "איך לבחור את האדם הנכון לבניית האתר",
        text: "לא רק לפי מחיר או תיק עבודות — אלא לפי הדברים שבאמת משפיעים על התהליך ועל התוצאה.",
      },
      {
        id: "before-start",
        icon: "zap",
        title: "מה חייבים לסגור לפני שמתחילים",
        text: "מה האתר צריך לעשות, למי הוא מיועד ואיזה תוכן צריך להכין מראש.",
      },
      {
        id: "save-money",
        icon: "rocket",
        title: "איפה בעלי עסקים מבזבזים כסף",
        text: "ואיך להימנע מתוספות, שינויים והחלטות שאפשר היה למנוע מראש.",
      },
      {
        id: "no-disappointment",
        icon: "heart",
        title: "איך לא להגיע לסוף ולהתאכזב",
        text: "מה לבדוק לאורך הדרך כדי שהאתר שתקבלו באמת יהיה האתר שדמיינתם.",
      },
    ],
    cta: { label: "אני רוצה את המדריך", action: "scroll-to-form" },
  },
  splitPrimary: {
    id: "split-primary",
    title: "רוב הטעויות קורות עוד לפני שמתחילים לבנות",
    text: "בניית אתר היא לא רק החלטה עיצובית. אתם משקיעים כסף, זמן, תוכן ולא מעט מחשבה — והרבה מההחלטות החשובות מתקבלות עוד לפני שנכתבת שורת קוד אחת.\n\nבדיוק בגלל זה יצרתי את המדריך הזה: כדי שתגיעו לתהליך כשאתם יודעים מה לשאול, מה לבדוק ועל מה לא כדאי להתפשר.",
    cta: { label: "שלחו לי את המדריך", action: "scroll-to-form" },
  },
  process: {
    title: "איך זה עובד?",
    subtitle: "ארבעה צעדים פשוטים — מהטופס ועד המדריך.",
    steps: [
      {
        id: "s1",
        stepNumber: 1,
        title: "משאירים פרטים",
        text: "ממלאים את הטופס הקצר בעמוד.",
      },
      {
        id: "s2",
        stepNumber: 2,
        title: "מקבלים את המדריך",
        text: "המדריך יחכה לכם מיד לאחר השארת הפרטים.",
      },
      {
        id: "s3",
        stepNumber: 3,
        title: "קוראים בזמן שלכם",
        text: "בלי חפירות ובלי חומר מיותר — רק דברים שכדאי לדעת לפני שמתחילים.",
      },
      {
        id: "s4",
        stepNumber: 4,
        title: "מגיעים מוכנים יותר",
        text: "וכשתחליטו לבנות את האתר, כבר תדעו בדיוק מה לבדוק ומה לשאול.",
      },
    ],
  },
  ctaBanner: {
    title: "עדיף לקרוא 5 דקות עכשיו מאשר לגלות את הטעויות אחרי שהאתר כבר בנוי.",
    text: "המדריך חינמי, קצר ולעניין.",
    cta: { label: "אני רוצה לקבל אותו", action: "scroll-to-form" },
  },
  splitSecondary: {
    id: "split-secondary",
    title: "למה בכלל כתבתי את המדריך הזה?",
    text: "אני בונה ומעצב אתרים לעסקים, ובמהלך העבודה שלי אני פוגש בעלי עסקים שמגיעים עם המון שאלות — ולפעמים גם אחרי חוויה פחות טובה מתהליך קודם.\n\nשמתי לב שחלק גדול מהבעיות חוזרות על עצמן, והרבה מהן היו יכולות להימנע אם מישהו היה מסביר כמה דברים פשוטים לפני שמתחילים.\n\nאז ריכזתי את הדברים האלה למדריך אחד קצר, פשוט ובגובה העיניים.",
    cta: { label: "שלחו לי את המדריך", action: "scroll-to-form" },
    reversed: true,
  },
  faq: {
    title: "שאלות נפוצות",
    items: [
      {
        id: "faq-1",
        question: "המדריך באמת בחינם?",
        answer: "כן. משאירים פרטים ומקבלים גישה למדריך ללא תשלום.",
      },
      {
        id: "faq-2",
        question: "למי המדריך מתאים?",
        answer:
          "בעיקר לבעלי עסקים שמתכננים לבנות את האתר הראשון שלהם, אבל גם למי שכבר יש לו אתר ושוקל לבנות אחד חדש.",
      },
      {
        id: "faq-3",
        question: "צריך להבין משהו בבניית אתרים?",
        answer: "ממש לא. המדריך נכתב לבעלי עסקים ולא למפתחים, בלי מונחים טכניים מיותרים.",
      },
      {
        id: "faq-4",
        question: "כמה זמן לוקח לקרוא אותו?",
        answer:
          "הוא בנוי להיות קצר וממוקד. המטרה היא לתת לכם את הדברים החשובים בלי להפוך את זה לקורס.",
      },
      {
        id: "faq-5",
        question: "ומה קורה אחרי שאני משאיר פרטים?",
        answer: "תעברו לעמוד קצר נוסף, ולאחר מכן תוכלו לקבל את המדריך.",
      },
    ],
  },
  leadForm: {
    title: "רוצים את המדריך? הוא שלכם.",
    subtitle:
      'השאירו פרטים וקבלו את "5 הטעויות שבעלי עסקים עושים כשהם בונים את האתר הראשון שלהם".',
    submitLabel: "שלחו לי את המדריך",
    submittingLabel: "שולח...",
    fields: {
      name: { label: "שם מלא", placeholder: "איך קוראים לכם?" },
      phone: { label: "טלפון", placeholder: "05X-XXX-XXXX" },
      email: { label: "מייל", placeholder: "example@email.com" },
      message: { label: "הודעה (אופציונלי)", placeholder: "ספרו לי בקצרה על העסק..." },
    },
    errorMessage: "לא ניתן לשלוח את הפרטים כרגע. נסו שוב מאוחר יותר.",
  },
  finalCta: {
    title: "רגע לפני שאתם מתחילים לבנות אתר...",
    text: "תנו לעצמכם כמה דקות להבין מה כדאי לדעת מראש. זה יכול לשנות לגמרי את הדרך שבה תיגשו לתהליך.",
    cta: { label: "אני רוצה את המדריך החינמי", action: "scroll-to-form" },
  },
  thankYou: {
    stepLabel: "שלב 2 מתוך 2",
    title: "כמעט סיימנו!",
    subtitle: "קיבלנו את הפרטים שלכם. עוד רגע קטן ונוכל להבין בדיוק מה אתם צריכים.",
    nextStepsTitle: "מה קורה עכשיו?",
    nextSteps: [
      "נבדוק את הפרטים שהשארתם",
      "נחזור אליכם בהקדם לשיחה קצרה",
      "נציע כיוון מדויק לאתר שלכם",
    ],
    qualification: {
      title: "עוד 3 שאלות קצרות",
      subtitle: "זה יעזור לנו להגיע מוכנים לשיחה — ולחסוך לכם זמן.",
      submitLabel: "סיימתי — שלח",
      submittingLabel: "שומר...",
      questions: [
        {
          id: "question_1",
          type: "text",
          question: "מה סוג העסק שלכם?",
          placeholder: "לדוגמה: מסעדה, קליניקה, חנות...",
          required: true,
        },
        {
          id: "question_2",
          type: "text",
          question: "מה המטרה העיקרית של האתר?",
          placeholder: "לדוגמה: להביא פניות, למכור, להציג שירותים...",
          required: true,
        },
        {
          id: "question_3",
          type: "text",
          question: "מתי תרצו להתחיל?",
          placeholder: "לדוגמה: מיד, בחודש הקרוב...",
          required: false,
        },
      ],
    },
    completedTitle: "מעולה, סיימנו!",
    completedText: "תודה — קיבלנו את כל המידע. נחזור אליכם בהקדם.",
    errorMessage: "לא ניתן לשמור את התשובות כרגע. נסו שוב.",
  },
};
