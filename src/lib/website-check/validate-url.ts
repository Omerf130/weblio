export type WebsiteUrlValidationResult =
  | { ok: true; normalized: string }
  | { ok: false; message: string };

const EMPTY_MESSAGE = "יש להזין כתובת אתר.";
const INVALID_MESSAGE = "כתובת האתר אינה תקינה. השתמשו בכתובת שמתחילה ב-http:// או https://.";

function trimInput(raw: string): string {
  return raw.trim();
}

function normalizeHostInput(raw: string): string {
  const trimmed = trimInput(raw);
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    const host = parsed.hostname;
    if (!host) return false;
    if (host === "localhost") return true;
    if (host.includes(".")) return true;
    return false;
  } catch {
    return false;
  }
}

export function validateWebsiteUrl(raw: string): WebsiteUrlValidationResult {
  const trimmed = trimInput(raw);
  if (!trimmed) {
    return { ok: false, message: EMPTY_MESSAGE };
  }

  const normalized = normalizeHostInput(trimmed);
  if (!isValidHttpUrl(normalized)) {
    return { ok: false, message: INVALID_MESSAGE };
  }

  return { ok: true, normalized: new URL(normalized).href };
}
