import OpenAI from "openai";
import { resolveOpenAIIntentEnv } from "@/lib/discovery/classifier/openai-env";

let client: OpenAI | null = null;
let warnedMissingKey = false;

export function getOpenAIClient(): OpenAI | null {
  const env = resolveOpenAIIntentEnv();
  if (!env) {
    if (
      !warnedMissingKey &&
      process.env.OPENAI_INTENT_CLASSIFICATION_ENABLED === "1" &&
      !process.env.OPENAI_API_KEY?.trim()
    ) {
      warnedMissingKey = true;
      console.warn(
        "[openai-intent] OPENAI_INTENT_CLASSIFICATION_ENABLED=1 but OPENAI_API_KEY is missing — using NoOp classifier."
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
export function _resetOpenAIClientForTesting(): void {
  client = null;
  warnedMissingKey = false;
}
