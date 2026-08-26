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
    title: "בואו נבנה את האתר שלכם | Weblio",
    description:
      "דף נחיתה פרימיום לעסקים שרוצים אתר מודרני, מרשים וממיר. השאירו פרטים ונחזור אליכם בהקדם.",
  },
  images: {
    hero: { ...PLACEHOLDER("hero", "Hero Preview", 720, 540), priority: true },
    splitPrimary: PLACEHOLDER("split-1", "Design Preview", 640, 480),
    splitSecondary: PLACEHOLDER("split-2", "Results Preview", 640, 480),
  },
  hero: {
    eyebrow: "WEBLIO · PREMIUM WEB DESIGN",
    title: "אתר שיגרום ללקוחות לעצור, להסתכל — ולהשאיר פרטים",
    subtitle:
      "אני בונה אתרים מודרניים, מהירים ומרשימים לעסקים שרוצים להיראות ברמה הבאה. אם דף הנחיתה הזה נראה ככה — דמיינו מה יקרה לאתר שלכם.",
    ctaPrimary: { label: "אני רוצה אתר כזה", action: "scroll-to-form" },
    ctaSecondary: { label: "ספרו לי עוד", action: "scroll-to-form" },
  },
  benefits: {
    title: "למה לבחור ב-Weblio?",
    subtitle: "לא עוד אתר גנרי. חוויה דיגיטלית שמרגישה פרימיום מהרגע הראשון.",
    items: [
      {
        id: "design",
        icon: "sparkles",
        title: "עיצוב שמרים את העסק",
        text: "מראה מקצועי, מודרני ויוקרתי — שגורם לגולשים לסמוך עליכם מיד.",
      },
      {
        id: "speed",
        icon: "zap",
        title: "מהירות שמרגישים",
        text: "אתרים מהירים שעובדים מושלם גם בנייד — חשוב במיוחד לפרסום בפייסבוק.",
      },
      {
        id: "conversion",
        icon: "rocket",
        title: "בנוי להמרה",
        text: "כל אלמנט מוביל לפעולה. לא מעצבים רק יפה — בונים אתר שמביא פניות.",
      },
      {
        id: "personal",
        icon: "heart",
        title: "יחס אישי וצמוד",
        text: "עובדים יחד לאורך כל הדרך, עם הקשבה, שקיפות וגמישות.",
      },
    ],
    cta: { label: "בואו נדבר על האתר שלכם", action: "scroll-to-form" },
  },
  splitPrimary: {
    id: "split-primary",
    title: "הרושם הראשוני קובע הכל",
    text: "תוך 3 שניות הגולש מחליט אם לסמוך עליכם. אתר פרימיום יוצר תחושת איכות, יציבות ומקצועיות — לפני שהוא קרא מילה.",
    cta: { label: "אני רוצה רושם כזה", action: "scroll-to-form" },
  },
  process: {
    title: "איך זה עובד?",
    subtitle: "תהליך פשוט, ברור ונעים — בלי כאבי ראש.",
    steps: [
      { id: "s1", stepNumber: 1, title: "שיחה קצרה", text: "מבינים את העסק, המטרות והסגנון." },
      { id: "s2", stepNumber: 2, title: "עיצוב ואפיון", text: "בונים כיוון ויזואלי שמרגיש בדיוק אתם." },
      { id: "s3", stepNumber: 3, title: "פיתוח והקמה", text: "הופכים את הרעיון לאתר חי, מהיר ומדויק." },
      { id: "s4", stepNumber: 4, title: "עלייה לאוויר", text: "משיקים ומתחילים להביא פניות." },
    ],
  },
  ctaBanner: {
    title: "מוכנים לרמה הבאה?",
    text: "השאירו פרטים עכשיו — ונחזור אליכם עם כיוון ברור לאתר שיהפוך מבקרים ללקוחות.",
    cta: { label: "כן, אני רוצה להתחיל", action: "scroll-to-form" },
  },
  splitSecondary: {
    id: "split-secondary",
    title: "לא צריך אתר מסובך — צריך אתר שעובד",
    text: "מסר ברור, עיצוב נקי, חוויית משתמש מדויקת וקריאות לפעולה חכמות. בדיוק מה שדף נחיתה טוב צריך.",
    cta: { label: "בואו נתחיל", action: "scroll-to-form" },
    reversed: true,
  },
  faq: {
    title: "שאלות נפוצות",
    items: [
      {
        id: "faq-1",
        question: "כמה זמן לוקח לבנות אתר?",
        answer: "תלוי בהיקף, אבל רוב הפרויקטים נעים בין שבועיים לחודשיים. נתאים לוח זמנים שמתאים לכם.",
      },
      {
        id: "faq-2",
        question: "האם האתר יהיה מותאם לנייד?",
        answer: "בהחלט. כל אתר נבנה mobile-first — חשוב במיוחד לגולשים מפייסבוק ואינסטagram.",
      },
      {
        id: "faq-3",
        question: "מה קורה אחרי שמשאירים פרטים?",
        answer: "נחזור אליכם בהקדם, נבין את הצרכים — ונציע כיוון מדויק לפרויקט.",
      },
    ],
  },
  leadForm: {
    title: "בואו נבנה את האתר שלכם",
    subtitle: "השאירו פרטים ונחזור אליכם בהקדם עם הצעד הבא.",
    submitLabel: "שלחו ונתחיל",
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
    title: "הגיע הזמן שהאתר שלכם ייראה ברמה שלכם",
    text: "אל תפספסו את הרגע. השאירו פרטים — ונדבר על האתר הבא שלכם.",
    cta: { label: "אני מוכן/ה — בואו נתחיל", action: "scroll-to-form" },
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
