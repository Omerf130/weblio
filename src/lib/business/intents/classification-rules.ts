import {
  INTENT_CLASSIFICATIONS,
  type IntentClassification,
} from "@/types/intent";

export const INTENT_CLASSIFICATION_LABELS: Record<IntentClassification, string> = {
  unclassified: "טרם סווג",
  explicitNeed: "צורך מפורש",
  possibleNeed: "צורך אפשרי",
  irrelevant: "לא רלוונטי",
};

/** Classifications a future Intent → Opportunity conversion may accept. */
export const CONVERTIBLE_INTENT_CLASSIFICATIONS = [
  "explicitNeed",
  "possibleNeed",
] as const;

export type ConvertibleIntentClassification =
  (typeof CONVERTIBLE_INTENT_CLASSIFICATIONS)[number];

export function isIntentClassification(value: string): value is IntentClassification {
  return (INTENT_CLASSIFICATIONS as readonly string[]).includes(value);
}

export function isConvertibleIntentClassification(
  classification: IntentClassification
): classification is ConvertibleIntentClassification {
  return (CONVERTIBLE_INTENT_CLASSIFICATIONS as readonly string[]).includes(
    classification
  );
}

export function canIntentClassificationConvertToOpportunity(
  classification: IntentClassification
): boolean {
  return isConvertibleIntentClassification(classification);
}
