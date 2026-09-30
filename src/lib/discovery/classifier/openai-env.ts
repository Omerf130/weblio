export const DEFAULT_OPENAI_INTENT_MODEL = "gpt-5.4-nano";

export const OPENAI_INTENT_PROMPT_SUFFIX = "prompt-v2";

export const DEFAULT_OPENAI_INTENT_TIMEOUT_MS = 20_000;

const MAX_CLASSIFIER_VERSION_LENGTH = 64;

export type ResolvedOpenAIIntentEnv = {
  apiKey: string;
  model: string;
  timeoutMs: number;
};

export function isOpenAIIntentClassificationEnabled(
  source: Record<string, string | undefined> = process.env
): boolean {
  return source.OPENAI_INTENT_CLASSIFICATION_ENABLED === "1";
}

export function resolveOpenAIIntentEnv(
  source: Record<string, string | undefined> = process.env
): ResolvedOpenAIIntentEnv | null {
  if (!isOpenAIIntentClassificationEnabled(source)) {
    return null;
  }

  const apiKey = source.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const model =
    source.OPENAI_INTENT_MODEL?.trim() || DEFAULT_OPENAI_INTENT_MODEL;

  const timeoutRaw = source.OPENAI_INTENT_TIMEOUT_MS?.trim();
  let timeoutMs = DEFAULT_OPENAI_INTENT_TIMEOUT_MS;
  if (timeoutRaw) {
    const parsed = Number.parseInt(timeoutRaw, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      timeoutMs = parsed;
    }
  }

  return { apiKey, model, timeoutMs };
}

export function buildOpenAIClassifierVersion(model: string): string {
  const version = `openai-responses:${model}:${OPENAI_INTENT_PROMPT_SUFFIX}`;
  if (version.length <= MAX_CLASSIFIER_VERSION_LENGTH) {
    return version;
  }
  return version.slice(0, MAX_CLASSIFIER_VERSION_LENGTH);
}
