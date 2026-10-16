import type OpenAI from "openai";
import {
  WEBSITE_CHECK_AI_JSON_SCHEMA,
  WEBSITE_CHECK_AI_SCHEMA_NAME,
} from "@/lib/website-check/ai/website-check-ai-schema";
import type { ResolvedWebsiteCheckAiEnv } from "@/lib/website-check/ai/website-check-ai-env";

export const WEBSITE_CHECK_AI_SYSTEM_PROMPT = `You write concise Hebrew recommendations for Israeli business owners based ONLY on structured Lighthouse audit data provided in JSON.
Rules:
- Natural, friendly Hebrew. No developer jargon unless unavoidable.
- Never invent audits, metrics, scores, or business impact (sales, conversions, user behavior).
- Do not claim full UX, SEO ranking, or security audit.
- Each recommendation MUST reference auditIds from the input findings list only.
- optionalMetric may ONLY repeat an exact displayValue from the referenced findings; use empty string when not applicable.
- positiveSummary: use empty string when recommendations are non-empty; otherwise a short positive Hebrew summary.
- Maximum 3 recommendations. Do not fill slots with generic advice.
- If there are no meaningful actionable findings, return an empty recommendations array and a short positiveSummary in Hebrew.
- No em dashes. Keep text short.`;

export function buildWebsiteCheckAiResponsesCreateParams(
  env: ResolvedWebsiteCheckAiEnv,
  userJson: string
): OpenAI.Responses.ResponseCreateParamsNonStreaming {
  return {
    model: env.model,
    max_output_tokens: env.maxOutputTokens,
    input: [
      { role: "system", content: WEBSITE_CHECK_AI_SYSTEM_PROMPT },
      { role: "user", content: userJson },
    ],
    text: {
      format: {
        type: "json_schema",
        name: WEBSITE_CHECK_AI_SCHEMA_NAME,
        strict: true,
        schema: WEBSITE_CHECK_AI_JSON_SCHEMA,
      },
    },
  };
}

type JsonSchemaNode = {
  type?: string;
  properties?: Record<string, JsonSchemaNode>;
  required?: string[];
  items?: JsonSchemaNode;
};

/** Ensures OpenAI strict json_schema: every property key is listed in required. */
export function assertStrictJsonSchemaShape(schema: JsonSchemaNode): void {
  if (schema.type !== "object" || !schema.properties) {
    return;
  }

  const keys = Object.keys(schema.properties);
  const required = schema.required ?? [];
  for (const key of keys) {
    if (!required.includes(key)) {
      throw new Error(`strict schema: property "${key}" missing from required`);
    }
    const child = schema.properties[key];
    if (child?.items) {
      assertStrictJsonSchemaShape(child.items);
    } else if (child?.type === "object") {
      assertStrictJsonSchemaShape(child);
    }
  }
}
