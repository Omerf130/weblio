import { canIntentClassificationConvertToOpportunity } from "@/lib/business/intents/classification-rules";
import type { IntentClassification, IntentStatus } from "@/types/intent";

export type IntentConversionBlockReason =
  | "not_found"
  | "not_new"
  | "not_convertible_classification"
  | "already_converted";

export function getIntentConversionBlockReason(input: {
  status: IntentStatus;
  classification: IntentClassification;
  opportunityId?: string | null;
}): IntentConversionBlockReason | null {
  if (input.opportunityId) {
    return "already_converted";
  }

  if (input.status === "saved") {
    return "already_converted";
  }

  if (input.status !== "new") {
    return "not_new";
  }

  if (!canIntentClassificationConvertToOpportunity(input.classification)) {
    return "not_convertible_classification";
  }

  return null;
}

export function canConvertIntentToOpportunity(input: {
  status: IntentStatus;
  classification: IntentClassification;
  opportunityId?: string | null;
}): boolean {
  return getIntentConversionBlockReason(input) === null;
}
