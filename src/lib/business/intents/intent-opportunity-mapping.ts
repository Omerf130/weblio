import type { ConvertibleIntentClassification } from "@/lib/business/intents/classification-rules";
import type { IntentClassification, IntentStatus } from "@/types/intent";

export const OPPORTUNITY_TITLE_MAX = 200;
export const OPPORTUNITY_DESCRIPTION_MAX = 2000;
export const OPPORTUNITY_RELEVANCE_NOTE_MAX = 2000;
export const OPPORTUNITY_EXTERNAL_SOURCE_ID_MAX = 256;

export type IntentForOpportunityMapping = {
  id: string;
  title?: string;
  content: string;
  classification: IntentClassification;
  status: IntentStatus;
  classificationReason?: string;
  sourcePlatform?: string;
  sourceUrl?: string;
  externalId?: string;
  provider: string;
  dedupeKey?: string;
  opportunityId?: string;
};

export type MappedIntentOpportunityFields = {
  title: string;
  source: "intent";
  classification: ConvertibleIntentClassification;
  description: string;
  relevanceNote?: string;
  sourcePlatform?: string;
  sourceUrl?: string;
  externalSourceId?: string;
  intentId: string;
  status: "new";
  internalNotes: string;
};

function truncateWithEllipsis(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  if (max <= 1) {
    return trimmed.slice(0, max);
  }
  return `${trimmed.slice(0, max - 1)}…`;
}

export function deriveOpportunityTitleFromIntent(intent: IntentForOpportunityMapping): string {
  const title = intent.title?.trim();
  if (title) {
    return truncateWithEllipsis(title, OPPORTUNITY_TITLE_MAX);
  }
  const firstLine = intent.content.trim().split("\n")[0]?.trim() ?? "";
  return truncateWithEllipsis(firstLine || "ללא כותרת", OPPORTUNITY_TITLE_MAX);
}

function resolveExternalSourceId(intent: IntentForOpportunityMapping): string | undefined {
  const externalId = intent.externalId?.trim();
  if (externalId) {
    return truncateWithEllipsis(externalId, OPPORTUNITY_EXTERNAL_SOURCE_ID_MAX);
  }
  const dedupeKey = intent.dedupeKey?.trim();
  if (dedupeKey) {
    return truncateWithEllipsis(dedupeKey, OPPORTUNITY_EXTERNAL_SOURCE_ID_MAX);
  }
  const fallback = `${intent.provider.trim()}:${intent.id}`;
  return truncateWithEllipsis(fallback, OPPORTUNITY_EXTERNAL_SOURCE_ID_MAX);
}

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function mapIntentToOpportunityFields(
  intent: IntentForOpportunityMapping
): MappedIntentOpportunityFields {
  const classification = intent.classification as ConvertibleIntentClassification;

  const description = truncateWithEllipsis(
    intent.content,
    OPPORTUNITY_DESCRIPTION_MAX
  );

  const reason = intent.classificationReason?.trim();
  const relevanceNote = reason
    ? truncateWithEllipsis(reason, OPPORTUNITY_RELEVANCE_NOTE_MAX)
    : undefined;

  const sourceUrl = intent.sourceUrl?.trim();
  const mappedUrl =
    sourceUrl && isHttpsUrl(sourceUrl) ? sourceUrl : undefined;

  const sourcePlatform = intent.sourcePlatform?.trim() || undefined;

  return {
    title: deriveOpportunityTitleFromIntent(intent),
    source: "intent",
    classification,
    description,
    relevanceNote,
    sourcePlatform,
    sourceUrl: mappedUrl,
    externalSourceId: resolveExternalSourceId(intent),
    intentId: intent.id,
    status: "new",
    internalNotes: "",
  };
}
