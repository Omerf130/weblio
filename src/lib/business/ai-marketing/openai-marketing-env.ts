export const DEFAULT_OPENAI_MARKETING_MODEL = "gpt-5.4-mini";

export const DEFAULT_OPENAI_MARKETING_TIMEOUT_MS = 30_000;

export const DEFAULT_OPENAI_MARKETING_MAX_OUTPUT_TOKENS = 1536;

export type ResolvedOpenAIMarketingEnv = {
  apiKey: string;
  model: string;
  timeoutMs: number;
  maxOutputTokens: number;
};

export function isOpenAIMarketingEnabled(
  source: Record<string, string | undefined> = process.env
): boolean {
  return source.OPENAI_MARKETING_ENABLED === "1";
}

export function resolveOpenAIMarketingEnv(
  source: Record<string, string | undefined> = process.env
): ResolvedOpenAIMarketingEnv | null {
  if (!isOpenAIMarketingEnabled(source)) {
    return null;
  }

  const apiKey = source.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const model =
    source.OPENAI_MARKETING_MODEL?.trim() || DEFAULT_OPENAI_MARKETING_MODEL;

  const timeoutRaw = source.OPENAI_MARKETING_TIMEOUT_MS?.trim();
  let timeoutMs = DEFAULT_OPENAI_MARKETING_TIMEOUT_MS;
  if (timeoutRaw) {
    const parsed = Number.parseInt(timeoutRaw, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      timeoutMs = parsed;
    }
  }

  const maxOutputRaw = source.OPENAI_MARKETING_MAX_OUTPUT_TOKENS?.trim();
  let maxOutputTokens = DEFAULT_OPENAI_MARKETING_MAX_OUTPUT_TOKENS;
  if (maxOutputRaw) {
    const parsed = Number.parseInt(maxOutputRaw, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      maxOutputTokens = Math.min(parsed, 4096);
    }
  }

  return { apiKey, model, timeoutMs, maxOutputTokens };
}
