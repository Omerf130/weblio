import { z } from "zod";

export const WEBSITE_CHECK_AI_SCHEMA_NAME = "website_check_ai_recommendations";

export const websiteCheckAiModelOutputSchema = z.object({
  recommendations: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(140),
        explanation: z.string().trim().min(1).max(700),
        action: z.string().trim().min(1).max(450),
        auditIds: z.array(z.string().trim().min(1).max(128)).min(1).max(5),
        optionalMetric: z.preprocess(
          (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
          z.string().trim().max(120).optional()
        ),
      })
    )
    .max(3),
  positiveSummary: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(500).optional()
  ),
});

export type WebsiteCheckAiModelOutput = z.infer<typeof websiteCheckAiModelOutputSchema>;

export const WEBSITE_CHECK_AI_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    recommendations: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          explanation: { type: "string" },
          action: { type: "string" },
          auditIds: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            maxItems: 5,
          },
          optionalMetric: { type: "string" },
        },
        required: ["title", "explanation", "action", "auditIds", "optionalMetric"],
      },
    },
    positiveSummary: { type: "string" },
  },
  required: ["recommendations", "positiveSummary"],
} as const;
