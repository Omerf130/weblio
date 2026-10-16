export const DEFAULT_WEBSITE_CHECK_AI_MODEL = "gpt-4o-mini";

export const DEFAULT_WEBSITE_CHECK_AI_TIMEOUT_MS = 25_000;

export const DEFAULT_WEBSITE_CHECK_AI_MAX_OUTPUT_TOKENS = 900;

export type ResolvedWebsiteCheckAiEnv = {
  apiKey: string;
  model: string;
  timeoutMs: number;
  maxOutputTokens: number;
};

export function isWebsiteCheckAiEnabled(
  source: Record<string, string | undefined> = process.env
): boolean {
  return source.WEBSITE_CHECK_AI_ENABLED === "1";
}

export function resolveWebsiteCheckAiEnv(
  source: Record<string, string | undefined> = process.env
): ResolvedWebsiteCheckAiEnv | null {
  if (!isWebsiteCheckAiEnabled(source)) {
    return null;
  }

  const apiKey = source.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const model = source.WEBSITE_CHECK_AI_MODEL?.trim() || DEFAULT_WEBSITE_CHECK_AI_MODEL;

  const timeoutRaw = source.WEBSITE_CHECK_AI_TIMEOUT_MS?.trim();
  let timeoutMs = DEFAULT_WEBSITE_CHECK_AI_TIMEOUT_MS;
  if (timeoutRaw) {
    const parsed = Number.parseInt(timeoutRaw, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      timeoutMs = Math.min(parsed, 60_000);
    }
  }

  const maxOutputRaw = source.WEBSITE_CHECK_AI_MAX_OUTPUT_TOKENS?.trim();
  let maxOutputTokens = DEFAULT_WEBSITE_CHECK_AI_MAX_OUTPUT_TOKENS;
  if (maxOutputRaw) {
    const parsed = Number.parseInt(maxOutputRaw, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      maxOutputTokens = Math.min(parsed, 2048);
    }
  }

  return { apiKey, model, timeoutMs, maxOutputTokens };
}
