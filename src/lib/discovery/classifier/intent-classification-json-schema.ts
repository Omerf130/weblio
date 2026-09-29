/** Strict JSON Schema for OpenAI Responses API structured output. */
export const INTENT_CLASSIFICATION_JSON_SCHEMA = {
  type: "object",
  properties: {
    classification: {
      type: "string",
      enum: ["explicitNeed", "possibleNeed", "irrelevant"],
    },
    reason: {
      type: "string",
      description:
        "Short explanation in Hebrew (one or two sentences).",
    },
  },
  required: ["classification", "reason"],
  additionalProperties: false,
} as const;

export const INTENT_CLASSIFICATION_SCHEMA_NAME = "intent_classification";
