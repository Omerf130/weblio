import type { IntentClassifierInput } from "@/lib/discovery/classifier/types";

export const MAX_CLASSIFIER_CONTENT_CHARS = 8_000;

const SYSTEM_INSTRUCTIONS = `You classify discovered source text for Weblio, an Israeli business that builds websites, landing pages, ecommerce stores, redesigns, and related web services.

Return JSON only with:
- classification: one of explicitNeed, possibleNeed, irrelevant
- reason: a short explanation in Hebrew (1–2 sentences)

Rules (be conservative):

explicitNeed — The source clearly expresses a current need or request for a Weblio-relevant service: website, landing page, ecommerce/store website, website redesign, web developer/designer, or another clearly relevant website-related service.

possibleNeed — There is a meaningful signal that the person or business may need a Weblio service, but they did not clearly request one. Do NOT label generic business chatter, hiring unrelated roles, or vague marketing as possibleNeed.

irrelevant — The content does not represent a useful potential Weblio business opportunity.

Judge only the provided source text. Do not invent needs. When uncertain between possibleNeed and irrelevant, prefer irrelevant.`;

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
