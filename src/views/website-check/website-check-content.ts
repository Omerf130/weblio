export const WEBSITE_CHECK_BENEFITS = [
  { id: "no-commitment", label: "ללא התחייבות" },
  { id: "clear-report", label: "דוח ברור ופשוט" },
  { id: "recommendations", label: "המלצות לשיפור" },
  { id: "four-areas", label: "4 תחומי בדיקה" },
] as const;

export const WEBSITE_CHECK_COPY = {
  eyebrow: "WEBLIO WEBSITE ANALYZER",
  headline: "בדקו את האתר שלכם בכמה שניות",
  description:
    "גלו את החוזקות והחולשות של האתר שלכם בביצועים, SEO, נגישות ותקינות טכנית - וקבלו כיוון ברור למה כדאי לשפר.",
  inputLabel: "כתובת האתר",
  inputPlaceholder: "https://www.yourwebsite.co.il",
  submitLabel: "בדקו את האתר שלי",
  demoNotice:
    "ציוני הדוגמה סביב המחשב הם להמחשה בלבד. מנוע הניתוח האמיתי עדיין בפיתוח.",
  scanning: {
    demoBanner: "הדמיית סריקה - בדיקה אמיתית עדיין לא פעילה",
    liveBanner: "ניתוח אמיתי - PageSpeed Insights (mobile)",
    title: "מבצעים בדיקה לאתר שלכם",
    body: "אנחנו מריצים הדמיה של תהליך הניתוח - ביצועים, SEO, נגישות ותקינות האתר. זה לא סריקה אמיתית של האתר שלכם.",
    liveTitle: "אנחנו בודקים את האתר שלך",
    liveBody: "אנחנו בודקים את האתר שלך. הבדיקה עשויה לקחת קצת זמן...",
    urlLabel: "כתובת לדוגמה",
    progressAriaLabel: "התקדמות הדמיית הסריקה",
    activityKicker: "פעילות נוכחית (הדמיה)",
    activityCompleteKicker: "סיום ההדמיה",
    completeTitle: "ההדמיה הסתיימה",
    completeBody:
      "רצף ההדמיה הושלם. ניתן לצפות בדוח הדגמה עם ציונים, ממצאים והמלצות סטטיים - ללא ניתוח אמיתי של האתר.",
    viewResultsLabel: "צפו בדוח ההדגמה",
    backLabel: "חזרה למסך ההתחלה",
    restartLabel: "התחילו מחדש",
    liveProgressAriaLabel: "התקדמות הניתוח",
    liveCompleteTitle: "הניתוח הושלם",
    livePartialTitle: "הניתוח הושלם חלקית",
    liveCompleteBody:
      "הניתוח האמיתי הסתיים והנתונים נשמרו. ניתן לצפות בדוח עם ציונים, ממצאים והמלצות מ-Lighthouse.",
    viewLiveResultsLabel: "צפו בדוח האמיתי",
    liveFailedTitle: "הניתוח נכשל",
    liveRetryLabel: "נסו שוב",
    liveActivityKicker: "סטטוס ניתוח",
    liveUrlLabel: "כתובת שנבדקת",
  },
} as const;
