import "server-only";

/**
 * Server-only entry for OpenAI intent classification wiring.
 * Import from ingestion, scripts, and server actions — never from Client Components.
 */
export { getOpenAIClient, _resetOpenAIClientForTesting } from "@/lib/discovery/classifier/openai-client";
export {
  createOpenAIIntentClassifierFromEnv,
  createOpenAIIntentClassifier,
} from "@/lib/discovery/classifier/openai-intent-classifier";
export { getIntentClassifierForIngest } from "@/lib/discovery/classifier/get-intent-classifier";
