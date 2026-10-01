export type WeblioBrandContext = {
  businessName: string;
  tagline: string;
  services: string[];
  targetAudience: string;
  tone: string;
  primaryLanguage: "he";
  ctaPreferences: string;
  avoidPhrases: string[];
  positioningNotes: string;
  promptVersion: string;
};

export const WEBLIO_BRAND_CONTEXT: WeblioBrandContext = {
  businessName: "Weblio",
  tagline:
    "עסק אישי של עומר - אתרים, עיצוב ודפי נחיתה לעסקים קטנים ובינוניים בישראל",
  services: [
    "בניית אתרים ודפי נחיתה",
    "עיצוב וחוויית משתמש מותאמת לעסק",
    "הקמה, תחזוקה ושיפורים שוטפים",
  ],
  targetAudience:
    "בעלי עסקים קטנים ובינוניים בישראל שרוצים נוכחות דיגיטלית ברורה, מקצועית ונגישה",
  tone:
    "עברית טבעית, אישית, מקצועית, בגובה העיניים - בטוחה בלי הגזמה, שיחה ולא תאגידית, ברורה ולא 'מלוטשת-AI'",
  primaryLanguage: "he",
  ctaPreferences:
    "קריאה לפעולה עדינה ובגוף ראשון יחיד - למשל: דברו איתי, לשוחח, ליצור קשר. לא דברו איתנו ולא לחץ אגרסיבי",
  avoidPhrases: [
    "הפתרון המושלם",
    "מובילים בעולם",
    "100% הצלחה",
    "מחיר הזייה",
    "יצרנו / בנינו / עיצבנו (סוכנות)",
    "דברו איתנו",
    "מתרגש לשתף",
    "פרויקט חדש באוויר",
    "מילוי שיווקי גנרי כשאפשר משפט קונקרטי מהנתונים",
  ],
  positioningNotes:
    "Weblio הוא העסק האישי של עומר - איכות, בהירות וליווי, לא תבנית זולה. העדף משפטים קונקרטיים מהפרויקט על פני סיסמאות שיווקיות. קול אישי אינו רשות להמציא עובדות ביוגרפיות.",
  promptVersion: "weblio-brand-v4",
};

export function getWeblioPunctuationInstructions(): string {
  return [
    "פיסוק ומקף (חובה בכל פלט שיווקי):",
    "- לעולם אל תשתמש במקף ארוך (em dash — U+2014).",
    "- לעולם אל תשתמש במקף בינוני (en dash – U+2013).",
    "- כשצריך מקף, השתמש רק במקף רגיל (-).",
  ].join("\n");
}

export function getWeblioVoiceInstructions(): string {
  return [
    "קול דיבור (Weblio = עומר, עסק אישי):",
    "- כשמתארים את העבודה מאחורי Weblio - גוף ראשון יחיד: בניתי, עיצבתי, יצרתי, עבדתי על…, אני בונה…",
    "- CTA מועדף: דברו איתי (לא דברו איתנו).",
    "- הימנע מגוף ראשון רבים סוכנותי: יצרנו, בנינו, עיצבנו, אנחנו ב-Weblio - אלא אם הוראת המשתמש (USER DATA) מבקשת במפורש קול רבים.",
    "- טון: אישי, מקצועי, בגובה העיניים, לא תאגידי, בלי מילוי שיווקי כשאפשר לנסח לפי נתוני הפרויקט.",
    "- בלי טענות מוגזמות; בלי להמציא עובדות, תוצאות או תגובות לקוח.",
    "- 'אישי' = טון וגוף דיבור, לא המצאת סיפור חיים, לקוחות, מסע עסקי או לקחים שלא סופקו.",
  ].join("\n");
}

export function formatBrandContextForPrompt(
  ctx: WeblioBrandContext = WEBLIO_BRAND_CONTEXT
): string {
  const services = ctx.services.map((s) => `- ${s}`).join("\n");
  const avoid = ctx.avoidPhrases.map((p) => `- ${p}`).join("\n");

  return [
    `שם: ${ctx.businessName}`,
    `תיאור קצר: ${ctx.tagline}`,
    "שירותים:",
    services,
    `קהל יעד: ${ctx.targetAudience}`,
    `סגנון כתיבה: ${ctx.tone}`,
    `שפה: ${ctx.primaryLanguage === "he" ? "עברית" : ctx.primaryLanguage}`,
    `העדפות CTA: ${ctx.ctaPreferences}`,
    getWeblioVoiceInstructions(),
    getWeblioPunctuationInstructions(),
    "מיצוב:",
    ctx.positioningNotes,
    "ביטויים/טענות להימנע מהם:",
    avoid,
    `גרסת הקשר מותג: ${ctx.promptVersion}`,
  ].join("\n");
}
