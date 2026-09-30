import type { IntentClassifierInput } from "@/lib/discovery/classifier/types";
import type { ClassifierOutputClassification } from "@/lib/discovery/classifier/types";

export const MAX_CLASSIFIER_CONTENT_CHARS = 8_000;

/** Documented regression expectations for prompt v2 (not live model guarantees). */
export type IntentClassificationRegressionFixture = {
  id: string;
  label: string;
  input: IntentClassifierInput;
  expected: ClassifierOutputClassification;
};

export const INTENT_CLASSIFICATION_REGRESSION_FIXTURES: IntentClassificationRegressionFixture[] =
  [
    {
      id: "A",
      label: "explicit buyer request",
      input: { content: "מחפש מישהו שיבנה לי אתר לעסק" },
      expected: "explicitNeed",
    },
    {
      id: "B",
      label: "explicit Shopify hire",
      input: { content: "מחפש בונה אתרים מקצועי להקמת חנות Shopify" },
      expected: "explicitNeed",
    },
    {
      id: "C",
      label: "seller offering services",
      input: { content: "אני בונה אתרים לעסקים, מוזמנים לפנות אליי" },
      expected: "irrelevant",
    },
    {
      id: "D",
      label: "service advertisement",
      input: { content: "בניית אתרים ודפי נחיתה לעסקים במחירים משתלמים" },
      expected: "irrelevant",
    },
    {
      id: "E",
      label: "agency service page",
      input: {
        title: "בניית אתרים לעסקים",
        content: "סוכנות מובילה לפיתוח אתרים, דפי נחיתה וחנויות. צרו קשר להצעת מחיר.",
        sourceType: "search_result",
      },
      expected: "irrelevant",
    },
    {
      id: "F",
      label: "developer portfolio",
      input: {
        title: "פורטפוליו",
        content: "שלום, אני מפתח אתרים. הנה דוגמאות מהפרויקטים שלי.",
      },
      expected: "irrelevant",
    },
    {
      id: "G",
      label: "generic cost article",
      input: {
        title: "כמה עולה לבנות אתר לעסק?",
        content: "מדריך כללי על טווחי מחירים לבניית אתרים לעסקים קטנים.",
      },
      expected: "irrelevant",
    },
    {
      id: "H",
      label: "ambiguous keywords",
      input: { content: "אתרים, דפי נחיתה, Shopify, WooCommerce, עיצוב אתרים" },
      expected: "irrelevant",
    },
    {
      id: "I",
      label: "explicit redesign recommendation",
      input: {
        content: "האתר שלנו מיושן, מחפשים המלצה על מישהו שיעצב אותו מחדש",
      },
      expected: "explicitNeed",
    },
    {
      id: "J",
      label: "possible need considering improvement",
      input: { content: "האתר שלנו מיושן ואנחנו בוחנים אפשרויות לשיפור" },
      expected: "possibleNeed",
    },
    {
      id: "K",
      label: "unrelated government page",
      input: {
        title: "משרד התחבורה",
        content: "מידע על רישוי רכב ותשתיות תחבורה.",
      },
      expected: "irrelevant",
    },
  ];

const SYSTEM_INSTRUCTIONS = `You classify discovered source text for Weblio.

Weblio is searching for potential CUSTOMERS who may BUY website-related services (websites, landing pages, ecommerce stores, redesigns, upgrades, and similar).

We are NOT looking for web developers, agencies, freelancers, designers, marketers, competitors, or service providers merely because they mention website services.

Return JSON only with:
- classification: one of explicitNeed, possibleNeed, irrelevant
- reason: a short explanation in Hebrew (1–2 sentences)

Classify the direction of intent: BUYER / DEMAND versus SELLER / SUPPLY.

Website-related keywords alone are NOT evidence of customer intent. Do not invent a need that is not supported by the supplied source.

explicitNeed — Requires positive demand-side evidence. The author, person, or business must clearly be seeking, requesting, asking for, looking to hire, asking for recommendations, or requesting proposals/help for a Weblio-relevant service (website creation, landing page, ecommerce/Shopify/WooCommerce store, redesign, upgrade, or similar).

Strong demand-side examples include phrasing like: "מחפש מישהו שיבנה לי אתר", "מחפשת בונה אתרים לעסק", "צריך מישהו לדף נחיתה", "מחפש המלצה על בונה אתרים", "מחפש בונה אתרים מקצועי להקמת חנות Shopify", "מי יכול לשדרג לי את האתר?".

A service page or advertisement containing words such as "בונה אתרים", "Shopify", or "דפי נחיתה" is NOT explicitNeed unless the text itself shows the author is seeking to BUY the service.

possibleNeed — Requires credible demand-side evidence without a fully explicit hire/request, such as: a business describes a website problem and appears to be considering improvement; outdated/broken/poor site with plausible need to hire; a question credibly indicating they may need someone.

Do NOT use possibleNeed merely because website-related keywords appear. If buyer-vs-seller direction is unclear, choose irrelevant.

irrelevant — Classify as irrelevant (unless the same content also contains credible buyer-side demand) when the content is primarily:
- web developers, agencies, freelancers, designers, or marketers offering services
- portfolios, agency/service landing pages, advertisements for website-building services
- website-building courses, tutorials, generic guides/articles, SEO pages, vendor/comparison pages
- content that merely contains website-related keywords
- ambiguous website-related text with no credible customer intent
- unrelated topics (e.g. government/unrelated institutions)

Seller examples: "אני בונה אתרים לעסקים, מוזמנים לפנות אליי" → irrelevant; "בניית אתרים ודפי נחיתה לעסקים במחירים משתלמים" → irrelevant; a generic article titled "כמה עולה לבנות אתר לעסק?" without seeker voice → irrelevant.

Judge only the provided source text. When uncertain between possibleNeed and irrelevant, prefer irrelevant. When buyer-vs-seller direction is unclear, prefer irrelevant.`;

export function getOpenAIIntentSystemInstructions(): string {
  return SYSTEM_INSTRUCTIONS;
}

export function truncateClassifierContent(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= MAX_CLASSIFIER_CONTENT_CHARS) {
    return trimmed;
  }
  return `${trimmed.slice(0, MAX_CLASSIFIER_CONTENT_CHARS)}…`;
}

export function buildOpenAIIntentClassificationMessages(
  input: IntentClassifierInput
): { system: string; user: string } {
  const parts: string[] = [];

  if (input.sourcePlatform?.trim()) {
    parts.push(`Platform: ${input.sourcePlatform.trim()}`);
  }
  if (input.sourceType?.trim()) {
    parts.push(`Source type: ${input.sourceType.trim()}`);
  }
  if (input.title?.trim()) {
    parts.push(`Title: ${input.title.trim()}`);
  }

  parts.push(`Content:\n${truncateClassifierContent(input.content)}`);

  return {
    system: SYSTEM_INSTRUCTIONS,
    user: parts.join("\n\n"),
  };
}
