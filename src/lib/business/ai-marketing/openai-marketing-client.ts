import OpenAI from "openai";
import { resolveOpenAIMarketingEnv } from "@/lib/business/ai-marketing/openai-marketing-env";

let client: OpenAI | null = null;
let warnedMissingKey = false;

export function getOpenAIMarketingClient(): OpenAI | null {
  const env = resolveOpenAIMarketingEnv();
  if (!env) {
    if (
      !warnedMissingKey &&
      process.env.OPENAI_MARKETING_ENABLED === "1" &&
      !process.env.OPENAI_API_KEY?.trim()
    ) {
      warnedMissingKey = true;
      console.warn(
        "[ai-marketing] OPENAI_MARKETING_ENABLED=1 but OPENAI_API_KEY is missing."
      );
    }
    return null;
  }

  if (!client) {
    client = new OpenAI({ apiKey: env.apiKey });
  }

  return client;
}

/** Reset cached client — for tests only. */
export function _resetOpenAIMarketingClientForTesting(): void {
  client = null;
  warnedMissingKey = false;
}
